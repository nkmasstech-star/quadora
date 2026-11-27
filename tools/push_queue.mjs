// Sends the manual notifications typed on the admin page (site/admin/push.html).
// The admin page adds items to Firestore doc pub/push { queue: [{ id, title, body, route, at }] } (only the owner can write).
// This script (run by the results-watch loop) reads that public doc, sends every item not sent yet to FCM topic "results",
// and remembers sent ids in tools/notified.json under _push. Items older than 24 h are skipped, never sent late.
import fs from 'node:fs';
import crypto from 'node:crypto';

const STATE = 'tools/notified.json';
const DOC = 'https://firestore.googleapis.com/v1/projects/qspot4d/databases/(default)/documents/pub/push?key=AIzaSyB-F6_5oWWZK4v6n5krWUBNSQvIMMBHk5g';
const ROUTES = ['/predictions', '/home', '/community', '/lucky', '/poll', '/straight'];

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

// Firestore REST value -> plain JS
function plain(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(plain);
  if ('mapValue' in v) { const o = {}; Object.entries(v.mapValue.fields || {}).forEach(([k, x]) => { o[k] = plain(x); }); return o; }
  return null;
}

const r = await fetch(DOC);
if (!r.ok) { console.log('push queue: no doc yet (' + r.status + ')'); process.exit(0); }
const fields = (await r.json()).fields || {};
const queue = (plain(fields.queue) || []).filter((x) => x && x.id && x.title);
const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
const done = new Set(st._push || []);
const now = Date.now();
const todo = queue.filter((x) => !done.has(x.id) && now - Number(x.at || 0) < 24 * 3600e3);
console.log('push queue:', queue.length, 'items,', todo.length, 'to send');
if (!todo.length) process.exit(0);
if (!process.env.FCM_SA) { console.log('FCM_SA not set: would send', todo.map((x) => x.title).join(' | ')); process.exit(0); }

const sa = JSON.parse(process.env.FCM_SA);
const at = await token(sa);
for (const x of todo) {
  const route = ROUTES.includes(x.route) ? x.route : '/predictions';
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
    body: JSON.stringify({ message: { topic: 'results', notification: { title: String(x.title).slice(0, 65), body: String(x.body || '').slice(0, 240) }, data: { route }, android: { priority: 'high' } } }),
  });
  console.log('manual push', x.id, '->', res.status);
  if (res.ok) done.add(x.id); else console.log(await res.text());
}
st._push = [...done].slice(-100);
fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
