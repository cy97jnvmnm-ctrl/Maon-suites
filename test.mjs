import { spawn } from 'node:child_process';
import fs from 'node:fs';
const PORT = 3111, B = 'http://localhost:' + PORT, DBF = '/tmp/maon-test.db', PW = 'test-Pass-' + Math.random().toString(36).slice(2), EM = 'sara.ginsburg.5777@gmail.com';
let srv; let pass = 0, failn = 0;
const ok = (c, n) => { c ? pass++ : failn++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const start = async () => { srv = spawn('node', ['--no-warnings', 'server.js'], { env: { ...process.env, PORT, DB_PATH: DBF, OWNER_PASSWORD: PW }, stdio: 'ignore' }); for (let i = 0; i < 50; i++) { try { await fetch(B + '/api/me'); return; } catch { await new Promise(r => setTimeout(r, 100)); } } throw 'no start'; };
const stop = async () => { srv.kill(); await new Promise(r => setTimeout(r, 300)); };
const post = (p, b, ck, h = {}) => fetch(B + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(ck ? { Cookie: ck } : {}), ...h }, body: JSON.stringify(b) });
const get = async (p, ck) => (await fetch(B + p, { headers: ck ? { Cookie: ck } : {} })).json();
const login = async (email, password) => { const r = await post('/api/login', { email, password }); const sc = r.headers.get('set-cookie'); return { r, ck: sc ? sc.split(';')[0] : null, sc }; };
fs.rmSync(DBF, { force: true });
await start();
// public / source hygiene
const html = await (await fetch(B + '/')).text(), js = await (await fetch(B + '/app.js')).text();
ok(!/owner mode|tap a date to edit/i.test(html + js), 'public page has no "Owner mode" text');
ok(!js.includes(PW) && !js.includes('todayitis') && !fs.readFileSync('server.js', 'utf8').includes('todayitis') && !/todayitis/.test(html), 'password not present in any served or server source file');
ok(!js.includes('localStorage'), 'no localStorage used');
ok(!html.includes('id="dash"') && !html.includes('Owner Dashboard'), 'dashboard markup not in public HTML');
// unauthenticated writes rejected
const w = { suite: 's1', from: '2026-10-25', to: '2026-10-29', status: 'reserved' };
ok((await post('/api/availability', w)).status === 401, 'unauthenticated write rejected (401)');
ok((await post('/api/availability', w, 'sid=forged')).status === 401, 'forged cookie write rejected (401)');
ok((await get('/api/availability')).s1.length === 0, 'nothing was written by rejected calls');
ok((await get('/api/me')).auth === false, 'anonymous /api/me = false');
// login rejections
ok((await login('', '')).r.status === 401, 'empty email+password rejected');
ok((await login(EM, '')).r.status === 401, 'empty password rejected');
ok((await login('', PW)).r.status === 401, 'empty email rejected');
ok((await login('wrong@x.com', PW)).r.status === 401, 'wrong email + right password rejected');
ok((await login(EM, 'nope')).r.status === 401, 'right email + wrong password rejected');
ok((await login('wrong@x.com', 'nope')).r.status === 401, 'wrong both rejected');
// correct login
let { r, ck, sc } = await login(EM.toUpperCase(), PW);
ok(r.status === 200 && ck, 'correct credentials accepted, session cookie set');
ok(/HttpOnly/.test(sc) && /SameSite=Strict/.test(sc), 'cookie is HttpOnly + SameSite=Strict');
ok((await get('/api/me', ck)).auth === true, 'session recognised by server');
// origin / content-type
ok((await post('/api/availability', w, ck, { Origin: 'https://evil.example' })).status === 403, 'cross-origin write rejected even with valid session');
ok((await fetch(B + '/api/availability', { method: 'POST', headers: { 'Content-Type': 'text/plain', Cookie: ck }, body: JSON.stringify(w) })).status === 415, 'non-JSON write rejected');
// validation
for (const [n, b] of [['bad suite', { ...w, suite: 's3' }], ['reversed range', { ...w, from: '2026-10-29', to: '2026-10-25' }], ['bad date', { ...w, from: '2026-02-31' }], ['past 2032', { ...w, to: '2033-01-01' }], ['bad status', { ...w, status: 'x' }]])
  ok((await post('/api/availability', b, ck)).status === 400, 'validation: ' + n);
// range save Oct 25-29 on suite 1
let st = await (await post('/api/availability', w, ck)).json();
ok(JSON.stringify(st.s1) === JSON.stringify(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']), 'Suite 1 Oct 25–29 → exactly 5 reserved days');
ok(st.s2.length === 0, 'Suite 2 unchanged');
// cross month + year
st = await (await post('/api/availability', { suite: 's1', from: '2026-10-29', to: '2026-11-03', status: 'reserved' }, ck)).json();
ok(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'].every(d => st.s1.includes(d)) && st.s1.length === 10, 'Oct 29 → Nov 3 crosses month (no duplicates)');
st = await (await post('/api/availability', { suite: 's2', from: '2026-12-30', to: '2027-01-02', status: 'reserved' }, ck)).json();
ok(JSON.stringify(st.s2) === JSON.stringify(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']), 'Suite 2 Dec 30 → Jan 2 crosses year');
ok(st.s1.length === 10, 'Suite 1 unaffected by Suite 2 edit');
st = await (await post('/api/availability', { suite: 's2', from: '2032-12-30', to: '2032-12-31', status: 'reserved' }, ck)).json();
ok(st.s2.includes('2032-12-31'), 'Dec 31, 2032 supported');
// persistence across server restart
await stop(); await start();
let pub = await get('/api/availability');
ok(pub.s1.includes('2026-10-27') && pub.s2.includes('2027-01-01'), 'reservations persist after server restart (database)');
ok((await get('/api/me', ck)).auth === true, 'session also survives restart');
// logout
r = await post('/api/logout', {}, ck);
ok((await get('/api/me', ck)).auth === false, 'after logout the old cookie is no longer valid');
ok((await post('/api/availability', { suite: 's1', from: '2026-11-10', to: '2026-11-11', status: 'reserved' }, ck)).status === 401, 'after logout: write rejected');
ok((await get('/api/availability')).s1.includes('2026-10-27'), 'public still sees reservations after logout');
// log back in, set available again
({ ck } = await login(EM, PW));
ok((await get('/api/availability', ck)).s1.includes('2026-10-27'), 'after re-login reservation still there');
st = await (await post('/api/availability', { suite: 's1', from: '2026-10-25', to: '2026-10-29', status: 'available' }, ck)).json();
ok(!['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].some(d => st.s1.includes(d)) && st.s1.length === 5, 'Oct 25–29 set back to Available; Oct 30–Nov 3 untouched');
ok(JSON.stringify((await get('/api/availability')).s1) === JSON.stringify(st.s1), 'public calendar immediately matches');
// rate limit
let last; for (let i = 0; i < 9; i++) last = (await login(EM, 'bad' + i)).r.status;
ok(last === 429, 'brute force locked out (429)');
ok((await login(EM, PW)).r.status === 429, 'even correct password refused during lockout');
// path traversal
ok((await fetch(B + '/..%2fserver.js')).status === 404 && !(await (await fetch(B + '/%2e%2e/server.js')).text()).includes('scryptSync'), 'server source not downloadable');
await stop();
console.log(`\n${pass} passed, ${failn} failed`); process.exit(failn ? 1 : 0);
