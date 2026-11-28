// Live results during the draw: reads 4dpredict.app every 15 s and writes the numbers shown so far (even a partial
// draw) to the public Firestore doc pub/live, which the app watches on the Results screen. Only writes when something
// changed. The official, complete result still comes only from fetch_results.mjs (23 numbers), and wins are checked
// only on that. Usage: node tools/live_results.mjs <seconds to run>   (needs FCM_SA = Firebase service account JSON)
import crypto from 'node:crypto';
import fs from 'node:fs';

const RUN_S = Number(process.argv[2] || 170);
const URL = 'https://www.4dpredict.app/';
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const TITLES = { magnum: /^MAGNUM 4D Classic/i, toto: /^TOTO 4D/i, damacai: /^DAMACAI 1\+3D/i, singapore: /^SINGAPORE POOLS/i, gdlotto: /^GRAND DRAGON LOTTO(?!\s*6D)/i };
const UTC_OFF = { magnum: 8, toto: 8, damacai: 8, singapore: 8, gdlotto: 7 };
const STATE = 'tools/live_last.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const four = /^\d{4}$/;

// numbers visible right now for each game whose shown draw is today's (operator time zone)
export function parseLive(html, now = Date.now()) {
  const out = {};
  for (const part of html.split('<span class="lottery-title">').slice(1)) {
    const title = part.slice(0, part.indexOf('</span>')).trim();
    const g = Object.keys(TITLES).find((k) => TITLES[k].test(title));
    if (!g || out[g]) continue;
    const date = (part.match(/[?&]d=(\d{4}-\d{2}-\d{2})/) || [])[1];
    const today = new Date(now + UTC_OFF[g] * 3600e3).toISOString().slice(0, 10);
    if (date !== today) continue;
    const end = part.search(/class="table-container|<\/section/);
    const body = end > 0 ? part.slice(0, end) : part.slice(0, 8000);
    const iSp = body.search(/>\s*SPECIAL\s*</i);
    const iCo = body.search(/>\s*CONSOLATION\s*</i);
    const cells = (x) => [...x.matchAll(/<td[^>]*>\s*([^<]{0,12}?)\s*<\/td>/g)].map((m) => m[1]).filter((c) => /^(\d{4}|\*{2,4}|-{2,4}|\?+)$/.test(c));
    const top = cells(iSp > 0 ? body.slice(0, iSp) : body).slice(0, 3).map((c) => (four.test(c) ? c : ''));
    const sp = iSp > 0 ? cells(body.slice(iSp, iCo > iSp ? iCo : undefined)).filter((c) => four.test(c)).slice(0, 10) : [];
    const co = iCo > 0 ? cells(body.slice(iCo)).filter((c) => four.test(c)).slice(0, 10) : [];
    while (top.length < 3) top.push('');
    const n = top.filter(Boolean).length + sp.length + co.length;
    if (n === 0) continue;
    out[g] = { date, first: top[0], second: top[1], third: top[2], special: sp, consolation: co, n, done: n >= 23 };
  }
  return out;
}

async function token(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${body}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${body}.${sig}` });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()));
  return (await r.json()).access_token;
}

async function write(at, games) {
  const r = await fetch('https://firestore.googleapis.com/v1/projects/qspot4d/databases/(default)/documents/pub/live', {
    method: 'PATCH', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(games) }, at: { integerValue: String(Date.now()) } } }),
  });
  if (!r.ok) throw new Error('write ' + r.status + ' ' + (await r.text()));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sa = process.env.FCM_SA ? JSON.parse(process.env.FCM_SA) : null;
  let at = null;
  let last = fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : '';
  const stop = Date.now() + RUN_S * 1000;
  while (Date.now() < stop) {
    try {
      const r = await fetch(URL + '?t=' + Date.now(), { headers: { 'user-agent': UA, 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) });
      const games = parseLive(await r.text());
      const key = JSON.stringify(games);
      if (key !== last) {
        console.log(new Date().toISOString().slice(11, 19), 'live:', Object.entries(games).map(([g, v]) => `${g} ${v.n}/23`).join(', ') || 'none');
        if (sa) { if (!at) at = await token(sa); await write(at, games); } else console.log('FCM_SA not set: not written');
        last = key; fs.writeFileSync(STATE, key);
      }
    } catch (e) { console.log('live error', String(e.message || e)); at = null; }
    if (Date.now() + 15000 >= stop) break;
    await sleep(15000);
  }
}
