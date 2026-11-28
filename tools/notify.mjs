// Sends one push (FCM topic "results") for each draw that is new since the last run.
// Reads draws from public/data/results.json and the manual Firestore doc (GD Lotto etc).
// Needs env FCM_SA (service account JSON). Without it, it only logs what it WOULD send.
// State: tools/notified.json = { game: lastNotifiedDate }. First run only records the current state (no spam).
import fs from 'node:fs';
import crypto from 'node:crypto';

const NAMES = { magnum: 'Magnum 4D', toto: 'Sports Toto 4D', damacai: 'Da Ma Cai', singapore: 'Singapore 4D', gdlotto: 'GD Lotto' };
const STATE = 'tools/notified.json';
const DRY = process.argv.includes('--dry');
const FS_URL = 'https://firestore.googleapis.com/v1/projects/qspot4d/databases/(default)/documents/pub/manual?key=AIzaSyB-F6_5oWWZK4v6n5krWUBNSQvIMMBHk5g';

// --pred: one push when new predictions are published (state in notified.json under _pred = { game: forDate }).
if (process.argv.includes('--pred')) {
  const pred = JSON.parse(fs.readFileSync('public/data/predictions.json', 'utf8'));
  const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
  const was = st._pred || null;
  const nowP = {}; Object.entries(pred.games || {}).forEach(([g, p]) => { if (p && p.forDate) nowP[g] = p.forDate; });
  const fresh = was ? Object.keys(nowP).filter((g) => nowP[g] !== was[g]) : [];
  console.log('predictions', JSON.stringify(nowP), was ? '' : '(first run: recording only)', 'new:', fresh.join(',') || 'none');
  let sent = true;
  if (fresh.length && !DRY) {
    if (!process.env.FCM_SA) { console.log('FCM_SA not set: would notify predictions', fresh.join(', ')); sent = false; } else {
      const sa = JSON.parse(process.env.FCM_SA);
      const at = await token(sa);
      const names = fresh.map((g) => NAMES[g]).join(', ');
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
        body: JSON.stringify({ message: { topic: 'results', notification: { title: 'New predictions are ready', body: `${names}. For entertainment only.` }, data: { route: fresh.length === 1 ? `/prediction/${fresh[0]}` : '/predictions' }, android: { priority: 'high' } } }),
      });
      console.log('prediction push ->', r.status);
      if (!r.ok) { console.log(await r.text()); sent = false; }
    }
  }
  if (sent && !DRY) { st._pred = nowP; fs.writeFileSync(STATE, JSON.stringify(st, null, 1)); }
  process.exit(0);
}
const results = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));
let manual = {};
try {
  const r = await fetch(FS_URL, { signal: AbortSignal.timeout(15000) });
  if (r.ok) { const j = await r.json(); manual = JSON.parse(j.fields.json.stringValue).games || {}; }
} catch (e) { console.log('manual doc not read:', e.message); }

const latest = {};
for (const g of Object.keys(NAMES)) {
  const dates = [...(results.games[g] || []), ...(manual[g] || [])].map((d) => d.date).sort();
  if (dates.length) latest[g] = dates[dates.length - 1];
}
const first = !fs.existsSync(STATE);
const prev = first ? {} : JSON.parse(fs.readFileSync(STATE, 'utf8'));
const fresh = Object.keys(latest).filter((g) => !first && (!prev[g] || latest[g] > prev[g]));
console.log('latest', JSON.stringify(latest), first ? '(first run: recording only)' : '', 'new:', fresh.join(',') || 'none');

async function token(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${body}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${body}.${sig}` });
  if (!r.ok) throw new Error('token ' + r.status);
  return (await r.json()).access_token;
}

let ok = true;
if (process.argv.includes('--test')) {
  const sa = JSON.parse(process.env.FCM_SA);
  const at = await token(sa);
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, { method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' }, body: JSON.stringify({ message: { topic: 'results', notification: { title: 'Q Spot 4D test', body: 'Push notifications are working.' }, android: { priority: 'high' } } }) });
  console.log('test push ->', r.status, r.ok ? '' : await r.text());
  process.exit(r.ok ? 0 : 1);
}
if (fresh.length && !DRY) {
  if (!process.env.FCM_SA) { console.log('FCM_SA not set: would notify', fresh.join(', ')); ok = false; } else {
    const sa = JSON.parse(process.env.FCM_SA);
    const at = await token(sa);
    for (const g of fresh) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
        body: JSON.stringify({ message: { topic: 'results', notification: { title: `${NAMES[g]} result is out`, body: 'Tap to see the winning numbers.' }, data: { route: `/game/${g}` }, android: { priority: 'high' } } }),
      });
      console.log(g, 'push ->', r.status);
      if (!r.ok) { console.log(await r.text()); ok = false; }
    }
  }
}
// keep every other state key (_pred, _push = manual pushes already sent); dropping _push made old manual pushes go out again
if (ok && !DRY) { const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => k.startsWith('_'))); fs.writeFileSync(STATE, JSON.stringify({ ...latest, ...keep, _pred: prev._pred || {} }, null, 1)); }
