// One-off check: is the Firebase project on the Blaze plan, and does a Storage bucket exist? (read only)
import crypto from 'node:crypto';
const sa = JSON.parse(process.env.FCM_SA); const P = sa.project_id;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: 'RS256', typ: 'JWT' });
const bd = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
const sg = crypto.createSign('RSA-SHA256').update(`${h}.${bd}`).sign(sa.private_key, 'base64url');
const at = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${h}.${bd}.${sg}` })).json()).access_token;
const H = { authorization: `Bearer ${at}` };
const show = async (name, url) => { const r = await fetch(url, { headers: H }); console.log('==', name, r.status, (await r.text()).slice(0, 600).replace(/\s+/g, ' ')); };
console.log('project', P);
await show('billingInfo', `https://cloudbilling.googleapis.com/v1/projects/${P}/billingInfo`);
await show('firebase project', `https://firebase.googleapis.com/v1beta1/projects/${P}`);
await show('storage buckets (firebase)', `https://firebasestorage.googleapis.com/v1beta/projects/${P}/buckets`);
await show('gcs bucket firebasestorage.app', `https://storage.googleapis.com/storage/v1/b/${P}.firebasestorage.app`);
await show('gcs bucket appspot', `https://storage.googleapis.com/storage/v1/b/${P}.appspot.com`);
await show('gcs list', `https://storage.googleapis.com/storage/v1/b?project=${P}`);
