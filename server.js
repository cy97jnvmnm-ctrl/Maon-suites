// Maon Suites — zero-dependency Node server (Node 22.13+). Auth, sessions and database live here.
// Storage: Neon Postgres when DATABASE_URL is set (production); otherwise a local SQLite file (dev/tests).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = +process.env.PORT || 3000;
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'sara.ginsburg.5777@gmail.com').trim().toLowerCase();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;
if (!OWNER_PASSWORD) { console.error('OWNER_PASSWORD environment variable is required.'); process.exit(1); }
// The password is never written anywhere: only a salted scrypt hash is kept in memory.
const SALT = crypto.randomBytes(16);
const PW_HASH = crypto.scryptSync(OWNER_PASSWORD, SALT, 64);
delete process.env.OWNER_PASSWORD;
const sha = s => crypto.createHash('sha256').update(s).digest();
const EMAIL_HASH = sha(OWNER_EMAIL);

// ---------------------------------------------------------------- database layer
const DATABASE_URL = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
const dbErr = e => Object.assign(new Error('database error'), { db: true, cause: e });
async function makeNeon(url) {
  const host = new URL(url).hostname.replace('-pooler', ''); // Neon's HTTP API needs the direct host
  const endpoint = process.env.NEON_HTTP_ENDPOINT || `https://${host}/sql`; // override only used by the test suite
  const q = async (query, params = []) => {
    let r, j;
    try {
      r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': url }, body: JSON.stringify({ query, params }), signal: AbortSignal.timeout(20000) });
      j = await r.json();
    } catch (e) { throw dbErr(e); }
    if (!r.ok) throw dbErr(new Error('HTTP ' + r.status + ' ' + (j.message || j.error || '')));
    const names = (j.fields || []).map(f => f.name);
    return (j.rows || []).map(row => Array.isArray(row) ? Object.fromEntries(row.map((v, i) => [names[i], v])) : row);
  };
  await q('CREATE TABLE IF NOT EXISTS reserved(suite TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(suite,day))');
  await q('CREATE TABLE IF NOT EXISTS sessions(tok TEXT PRIMARY KEY, exp BIGINT NOT NULL)');
  return {
    kind: 'neon-postgres',
    state: async () => { const o = { s1: [], s2: [] }; for (const r of await q('SELECT suite, day FROM reserved ORDER BY day')) o[r.suite]?.push(r.day); return o; },
    setRange: async (suite, days, status) => {
      if (status === 'available') await q('DELETE FROM reserved WHERE suite=$1 AND day>=$2 AND day<=$3', [suite, days[0], days[days.length - 1]]);
      else { const ph = days.map((_, i) => `($1,$${i + 2})`).join(','); await q(`INSERT INTO reserved(suite,day) VALUES ${ph} ON CONFLICT DO NOTHING`, [suite, ...days]); } // one atomic statement
    },
    sessAdd: (t, exp) => q('INSERT INTO sessions(tok,exp) VALUES($1,$2)', [t, exp]),
    sessGet: async t => { const r = await q('SELECT exp FROM sessions WHERE tok=$1', [t]); return r[0] ? { exp: Number(r[0].exp) } : null; },
    sessDel: t => q('DELETE FROM sessions WHERE tok=$1', [t]),
    sessClean: now => q('DELETE FROM sessions WHERE exp<$1', [now]),
  };
}
async function makeSqlite() {
  const { DatabaseSync } = await import('node:sqlite');
  const file = process.env.DB_PATH || path.join(process.cwd(), 'data', 'maon.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS reserved(suite TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(suite,day)) WITHOUT ROWID;
           CREATE TABLE IF NOT EXISTS sessions(tok TEXT PRIMARY KEY, exp INTEGER NOT NULL);`);
  const qAll = db.prepare('SELECT suite, day FROM reserved ORDER BY day'), qIns = db.prepare('INSERT OR IGNORE INTO reserved(suite,day) VALUES(?,?)'),
    qDel = db.prepare('DELETE FROM reserved WHERE suite=? AND day>=? AND day<=?'), sIns = db.prepare('INSERT INTO sessions(tok,exp) VALUES(?,?)'),
    sGet = db.prepare('SELECT exp FROM sessions WHERE tok=?'), sDel = db.prepare('DELETE FROM sessions WHERE tok=?'), sClean = db.prepare('DELETE FROM sessions WHERE exp<?');
  const wrap = f => async (...a) => { try { return f(...a); } catch (e) { throw dbErr(e); } };
  return {
    kind: 'sqlite', close: () => db.close(),
    state: wrap(() => { const o = { s1: [], s2: [] }; for (const r of qAll.all()) o[r.suite]?.push(r.day); return o; }),
    setRange: wrap((suite, days, status) => {
      if (status === 'available') { qDel.run(suite, days[0], days[days.length - 1]); return; }
      db.exec('BEGIN'); try { for (const d of days) qIns.run(suite, d); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
    }),
    sessAdd: wrap((t, exp) => sIns.run(t, exp)), sessGet: wrap(t => sGet.get(t) || null), sessDel: wrap(t => sDel.run(t)), sessClean: wrap(now => sClean.run(now)),
  };
}
const store = DATABASE_URL ? await makeNeon(DATABASE_URL) : await makeSqlite();
console.log('Storage:', store.kind);

// ---------------------------------------------------------------- auth helpers
const SESSION_MS = 12 * 3600 * 1000, MAX_DAY = '2032-12-31', MIN_DAY = '2020-01-01';
const fails = new Map(); // ip -> {n, t}
const ipOf = req => (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || req.socket.remoteAddress;
const blocked = ip => { const f = fails.get(ip); return f && Date.now() - f.t < 600000 && f.n >= 8; };
const fail = ip => { const f = fails.get(ip); if (!f || Date.now() - f.t >= 600000) fails.set(ip, { n: 1, t: Date.now() }); else { f.n++; f.t = Date.now(); } };
function checkLogin(email, password) {
  const a = crypto.timingSafeEqual(sha(String(email).trim().toLowerCase()), EMAIL_HASH);
  const b = crypto.timingSafeEqual(crypto.scryptSync(String(password), SALT, 64), PW_HASH);
  return a && b && String(email).length > 0 && String(password).length > 0;
}
const cookieOf = req => Object.fromEntries(String(req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]));
async function authed(req) {
  const tok = cookieOf(req).sid; if (!tok) return false;
  const r = await store.sessGet(sha(tok).toString('hex'));
  return !!r && r.exp > Date.now();
}
const secure = req => process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https';
const setCookie = (req, v, maxAge) => `sid=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;

const HEAD = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY'
};
const send = (res, code, obj, extra = {}) => { res.writeHead(code, { ...HEAD, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) { no(); req.destroy(); } }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { no(); } }); });
const realDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
const PUB = import.meta.dirname;
const PUBLIC_FILE = /^(index\.html|app\.js|style\.css|script\.png|[ab][1-5]\.jpg)$/; // ONLY these files are ever served (server.js is not one of them)

setInterval(() => { store.sessClean(Date.now()).catch(() => {}); for (const [k, f] of fails) if (Date.now() - f.t > 600000) fails.delete(k); }, 600000).unref();

const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  try {
    if (p === '/healthz') return send(res, 200, { ok: true });
    if (p.startsWith('/api/')) {
      if (req.method === 'GET' && p === '/api/availability') return send(res, 200, await store.state());
      if (req.method === 'GET' && p === '/api/me') return send(res, 200, { auth: await authed(req) });
      if (req.method !== 'POST') return send(res, 405, { error: 'method' });
      const o = req.headers.origin; // CSRF defence on top of SameSite=Strict
      let oh = null; try { oh = o ? new URL(o).host : null; } catch {}
      if (o && oh !== req.headers.host) return send(res, 403, { error: 'origin' });
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'type' });
      const b = await body(req);
      if (p === '/api/login') {
        const ip = ipOf(req);
        if (blocked(ip)) return send(res, 429, { error: 'too_many' });
        if (!b.email || !b.password || !checkLogin(b.email, b.password)) { fail(ip); return send(res, 401, { error: 'bad_credentials' }); }
        fails.delete(ip); await store.sessClean(Date.now());
        const tok = crypto.randomBytes(32).toString('hex');
        await store.sessAdd(sha(tok).toString('hex'), Date.now() + SESSION_MS);
        return send(res, 200, { auth: true }, { 'Set-Cookie': setCookie(req, tok, SESSION_MS / 1000) });
      }
      if (p === '/api/logout') {
        const tok = cookieOf(req).sid; if (tok) await store.sessDel(sha(tok).toString('hex'));
        return send(res, 200, { auth: false }, { 'Set-Cookie': setCookie(req, '', 0) });
      }
      if (p === '/api/availability') {
        if (!(await authed(req))) return send(res, 401, { error: 'auth_required' });   // <- the write gate
        const { suite, from, to, status } = b;
        if (!['s1', 's2'].includes(suite) || !['reserved', 'available'].includes(status) || !realDay(from) || !realDay(to) || from > to || from < MIN_DAY || to > MAX_DAY) return send(res, 400, { error: 'invalid' });
        const days = []; for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
        if (days.length > 2500) return send(res, 400, { error: 'too_long' });
        await store.setRange(suite, days, status);
        return send(res, 200, await store.state());
      }
      return send(res, 404, { error: 'not_found' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, HEAD); return res.end(); }
    const name = p === '/' ? 'index.html' : p.slice(1);
    const f = path.join(PUB, name);
    if (!PUBLIC_FILE.test(name) || !fs.existsSync(f)) { res.writeHead(404, HEAD); return res.end('Not found'); }
    const ext = path.extname(f);
    res.writeHead(200, { ...HEAD, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(f).pipe(res);
  } catch (e) { if (!res.headersSent) send(res, e && e.db ? 503 : 400, { error: e && e.db ? 'database_unavailable' : 'bad_request' }); }
});
server.listen(PORT, () => console.log('Maon Suites on :' + PORT));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { server.close(); try { store.close?.(); } catch {} process.exit(0); });
