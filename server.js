// Maon Suites — zero-dependency Node server (Node 22+). Auth, sessions and database all live here.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

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

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'maon.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`CREATE TABLE IF NOT EXISTS reserved(suite TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(suite,day)) WITHOUT ROWID;
         CREATE TABLE IF NOT EXISTS sessions(tok TEXT PRIMARY KEY, exp INTEGER NOT NULL);`);
const qAll = db.prepare('SELECT suite, day FROM reserved ORDER BY day');
const qIns = db.prepare('INSERT OR IGNORE INTO reserved(suite,day) VALUES(?,?)');
const qDel = db.prepare('DELETE FROM reserved WHERE suite=? AND day=?');
const sIns = db.prepare('INSERT INTO sessions(tok,exp) VALUES(?,?)');
const sGet = db.prepare('SELECT exp FROM sessions WHERE tok=?');
const sDel = db.prepare('DELETE FROM sessions WHERE tok=?');
const sClean = db.prepare('DELETE FROM sessions WHERE exp<?');

const SESSION_MS = 12 * 3600 * 1000, MAX_DAY = '2032-12-31', MIN_DAY = '2020-01-01';
const state = () => { const o = { s1: [], s2: [] }; for (const r of qAll.all()) o[r.suite].push(r.day); return o; };

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
function authed(req) {
  const tok = cookieOf(req).sid; if (!tok) return false;
  const r = sGet.get(sha(tok).toString('hex'));
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
const PUB = path.join(import.meta.dirname, 'public');

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); const p = url.pathname;
  try {
    if (p.startsWith('/api/')) {
      if (req.method === 'GET' && p === '/api/availability') return send(res, 200, state());
      if (req.method === 'GET' && p === '/api/me') return send(res, 200, { auth: authed(req) });
      if (req.method !== 'POST') return send(res, 405, { error: 'method' });
      const o = req.headers.origin; // CSRF defence on top of SameSite=Strict
      if (o && new URL(o).host !== req.headers.host) return send(res, 403, { error: 'origin' });
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'type' });
      const b = await body(req);
      if (p === '/api/login') {
        const ip = ipOf(req);
        if (blocked(ip)) return send(res, 429, { error: 'too_many' });
        if (!b.email || !b.password || !checkLogin(b.email, b.password)) { fail(ip); return send(res, 401, { error: 'bad_credentials' }); }
        fails.delete(ip); sClean.run(Date.now());
        const tok = crypto.randomBytes(32).toString('hex');
        sIns.run(sha(tok).toString('hex'), Date.now() + SESSION_MS);
        return send(res, 200, { auth: true }, { 'Set-Cookie': setCookie(req, tok, SESSION_MS / 1000) });
      }
      if (p === '/api/logout') {
        const tok = cookieOf(req).sid; if (tok) sDel.run(sha(tok).toString('hex'));
        return send(res, 200, { auth: false }, { 'Set-Cookie': setCookie(req, '', 0) });
      }
      if (p === '/api/availability') {
        if (!authed(req)) return send(res, 401, { error: 'auth_required' });   // <- the write gate
        const { suite, from, to, status } = b;
        if (!['s1', 's2'].includes(suite) || !['reserved', 'available'].includes(status) || !realDay(from) || !realDay(to) || from > to || from < MIN_DAY || to > MAX_DAY) return send(res, 400, { error: 'invalid' });
        const days = []; for (let t = Date.parse(from); t <= Date.parse(to); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
        if (days.length > 2500) return send(res, 400, { error: 'too_long' });
        db.exec('BEGIN'); try { for (const d of days) (status === 'reserved' ? qIns : qDel).run(suite, d); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
        return send(res, 200, state());
      }
      return send(res, 404, { error: 'not_found' });
    }
    // static files (public folder only)
    const f = path.normalize(path.join(PUB, p === '/' ? 'index.html' : p));
    if (!f.startsWith(PUB + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, HEAD); return res.end('Not found'); }
    const ext = path.extname(f);
    res.writeHead(200, { ...HEAD, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
    fs.createReadStream(f).pipe(res);
  } catch { send(res, 400, { error: 'bad_request' }); }
}).listen(PORT, () => console.log('Maon Suites on :' + PORT));
