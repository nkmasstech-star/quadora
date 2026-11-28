// Publishes firestore.rules to the live Firebase project (same as "firebase deploy --only firestore:rules").
// Needs FCM_SA = Firebase service account JSON. Run by .github/workflows/deploy-rules.yml when the rules change.
import crypto from 'node:crypto';
import fs from 'node:fs';

const sa = JSON.parse(process.env.FCM_SA);
const P = sa.project_id;
async function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${body}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${body}.${sig}` });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()));
  return (await r.json()).access_token;
}
const at = await token();
const H = { authorization: `Bearer ${at}`, 'content-type': 'application/json' };
async function publish(file, release) {
  const content = fs.readFileSync(file, 'utf8');
  const r1 = await fetch(`https://firebaserules.googleapis.com/v1/projects/${P}/rulesets`, { method: 'POST', headers: H, body: JSON.stringify({ source: { files: [{ name: file, content }] } }) });
  const rs1 = await r1.json();
  if (!r1.ok) { console.log(file, 'ruleset failed', r1.status, JSON.stringify(rs1)); process.exit(1); }
  const name = `projects/${P}/releases/${release}`;
  let r2 = await fetch(`https://firebaserules.googleapis.com/v1/${name}`, { method: 'PATCH', headers: H, body: JSON.stringify({ release: { name, rulesetName: rs1.name } }) });
  if (r2.status === 404) r2 = await fetch(`https://firebaserules.googleapis.com/v1/projects/${P}/releases`, { method: 'POST', headers: H, body: JSON.stringify({ name, rulesetName: rs1.name }) });
  console.log(file, 'release', r2.status, (await r2.text()).slice(0, 200));
  if (!r2.ok) process.exit(1);
}
await publish('storage.rules', `firebase.storage/${P}.firebasestorage.app`);
const content = fs.readFileSync('firestore.rules', 'utf8');
let r = await fetch(`https://firebaserules.googleapis.com/v1/projects/${P}/rulesets`, { method: 'POST', headers: H, body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content }] } }) });
const rs = await r.json();
if (!r.ok) { console.log('ruleset failed', r.status, JSON.stringify(rs)); process.exit(1); }
console.log('ruleset', rs.name);
const name = `projects/${P}/releases/cloud.firestore`;
r = await fetch(`https://firebaserules.googleapis.com/v1/${name}`, { method: 'PATCH', headers: H, body: JSON.stringify({ release: { name, rulesetName: rs.name } }) });
console.log('release', r.status, await r.text());
if (!r.ok) process.exit(1);
