// Leaders board + medals, worked out on the server so the app no longer needs hundreds of posts in memory.
// Writes the public Firestore doc pub/leaders: { at, json: { week, month, all (top 10 rows each), medals: {uid: kind} } }.
// Same rules as the app had: rolling 7 / 30 days and all time; min checked posts 2 / 3 / 4; ranked by win ratio.
// Medals: Silver = last finished week's top 5 (weeks start Monday, Malaysia time), Gold = last finished month's top 5,
// Diamond = all-time top 5 up to the start of this month. Reads: only posts from the last ~2 months each run;
// the all-time totals come from a full read once a day (kept in tools/leaders_all.json).
// Usage: node tools/leaders.mjs   (needs FCM_SA)
import crypto from 'node:crypto';
import fs from 'node:fs';

const sa = JSON.parse(process.env.FCM_SA); const P = sa.project_id;
const results = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));
const ALL_FILE = 'tools/leaders_all.json';
const MYT = 8 * 3600e3; const DAY = 864e5;

async function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const h = b64({ alg: 'RS256', typ: 'JWT' });
  const bd = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3000 });
  const sg = crypto.createSign('RSA-SHA256').update(`${h}.${bd}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${h}.${bd}.${sg}` });
  return (await r.json()).access_token;
}
const at = await token();
const BASE = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`;
const H = { authorization: `Bearer ${at}`, 'content-type': 'application/json' };

// Firestore REST value -> plain JS
const val = (v) => {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  return null;
};
// posts with at >= from (fields uid, at, picks only)
async function postsSince(from) {
  const out = []; let last = null;
  for (;;) {
    const q = { structuredQuery: { from: [{ collectionId: 'posts' }], select: { fields: [{ fieldPath: 'uid' }, { fieldPath: 'at' }, { fieldPath: 'picks' }] }, where: { fieldFilter: { field: { fieldPath: 'at' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(from) } } }, orderBy: [{ field: { fieldPath: 'at' }, direction: 'ASCENDING' }], limit: 500 } };
    if (last != null) q.structuredQuery.startAt = { values: [{ integerValue: String(last) }], before: false };
    const r = await fetch(`${BASE}:runQuery`, { method: 'POST', headers: H, body: JSON.stringify(q) });
    if (!r.ok) throw new Error('query ' + r.status + ' ' + (await r.text()));
    const rows = (await r.json()).filter((x) => x.document).map((x) => Object.fromEntries(Object.entries(x.document.fields).map(([k, v]) => [k, val(v)])));
    out.push(...rows);
    if (rows.length < 500) break;
    last = rows[rows.length - 1].at;
  }
  return out;
}

// --- same checks as the app ---
const norm = (s) => String(s).split('').sort().join('');
const drawsOf = (g) => (results.games && results.games[g]) || [];
function prizeNumbers(d) { return [d.first, d.second, d.third, ...(d.special || []), ...(d.consolation || [])].filter(Boolean); }
function evalPost(p) {
  let resolved = false; let won = false;
  (p.picks || []).forEach((k) => {
    const d = drawsOf(k.game).find((x) => x.date === k.forDate);
    if (!d) return;
    resolved = true;
    const nums = prizeNumbers(d);
    if ((k.sets || []).some((s) => nums.some((n) => (k.format === 'Straight' ? n === s : norm(n) === norm(s))))) won = true;
  });
  return { resolved, won };
}
function tally(posts, from, to) {
  const by = {};
  posts.forEach((p) => {
    if (p.at < from || p.at >= to) return;
    const e = evalPost(p); if (!e.resolved) return;
    const s = by[p.uid] || (by[p.uid] = { uid: p.uid, resolved: 0, won: 0 });
    s.resolved += 1; if (e.won) s.won += 1;
  });
  return by;
}
const rank = (by, min) => Object.values(by).filter((s) => s.resolved >= min && s.won > 0)
  .map((s) => ({ ...s, pct: Math.round((s.won / s.resolved) * 100) }))
  .sort((a, b) => b.won / b.resolved - a.won / a.resolved || b.won - a.won || b.resolved - a.resolved);

const now = Date.now(); const d = new Date(now + MYT);
const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - MYT;
const weekStart = dayStart - ((d.getUTCDay() + 6) % 7) * DAY;
const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - MYT;
const prevMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1) - MYT;
const today = new Date(now).toISOString().slice(0, 10);

// all-time totals: full read once a day; totals before this month are kept for the Diamond medal
// (also kept in Firestore pub/leaders_state, so a fresh runner does not read every post again)
let all = fs.existsSync(ALL_FILE) ? JSON.parse(fs.readFileSync(ALL_FILE, 'utf8')) : null;
if (!all) {
  const r = await fetch(`${BASE}/pub/leaders_state`, { headers: H });
  if (r.ok) { try { all = JSON.parse(val((await r.json()).fields.json)); } catch (e) { all = null; } }
}
if (!all || all.day !== today) {
  const every = await postsSince(0);
  all = { day: today, total: tally(every, 0, Infinity), beforeMonth: tally(every, 0, monthStart) };
  await fetch(`${BASE}/pub/leaders_state`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(all) } } }) });
  console.log('full read', every.length, 'posts');
}
fs.writeFileSync(ALL_FILE, JSON.stringify(all));
const recent = await postsSince(Math.min(prevMonth, now - 31 * DAY, weekStart - 7 * DAY));
console.log('recent', recent.length, 'posts');

const out = {
  week: rank(tally(recent, now - 7 * DAY, Infinity), 2).slice(0, 10),
  month: rank(tally(recent, now - 30 * DAY, Infinity), 3).slice(0, 10),
  all: rank(all.total, 4).slice(0, 10),
  medals: {},
};
const give = (rows, kind) => rows.slice(0, 5).forEach((r) => { if (!out.medals[r.uid]) out.medals[r.uid] = kind; });
give(rank(all.beforeMonth, 4), 'diamond');
give(rank(tally(recent, prevMonth, monthStart), 3), 'gold');
give(rank(tally(recent, weekStart - 7 * DAY, weekStart), 2), 'silver');

const key = JSON.stringify(out);
const prevKey = fs.existsSync('tools/leaders_last.json') ? fs.readFileSync('tools/leaders_last.json', 'utf8') : '';
if (key === prevKey) { console.log('leaders unchanged'); process.exit(0); }
const w = await fetch(`${BASE}/pub/leaders`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { json: { stringValue: key }, at: { integerValue: String(now) } } }) });
console.log('pub/leaders', w.status, w.ok ? '' : await w.text());
if (w.ok) fs.writeFileSync('tools/leaders_last.json', key);
