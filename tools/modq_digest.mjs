// Daily: if there are reported comments waiting, send one push to the admin phone (topic "admin").
// Usage: node tools/modq_digest.mjs   (needs FCM_SA)
import crypto from 'node:crypto';
const sa = JSON.parse(process.env.FCM_SA); const P = sa.project_id;
async function token(scope) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const h = b64({ alg: 'RS256', typ: 'JWT' });
  const bd = b64({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sg = crypto.createSign('RSA-SHA256').update(`${h}.${bd}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${h}.${bd}.${sg}` });
  return (await r.json()).access_token;
}
const at = await token('https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging');
const r = await fetch(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents/modq?pageSize=100&mask.fieldPaths=at`, { headers: { authorization: `Bearer ${at}` } });
const n = ((await r.json()).documents || []).length;
console.log('reported comments waiting:', n);
if (!n) process.exit(0);
const s = await fetch(`https://fcm.googleapis.com/v1/projects/${P}/messages:send`, {
  method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
  body: JSON.stringify({ message: { topic: 'admin', notification: { title: `${n} reported comment${n > 1 ? 's' : ''} to check`, body: 'Open the moderation page: Reported comments.' }, android: { priority: 'high' } } }),
});
console.log('push', s.status);
