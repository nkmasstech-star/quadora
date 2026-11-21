// Auto-fetch new draw results (numbers only) and merge them into public/data/results.json.
// Rules: a draw is added ONLY when all 23 numbers are present and valid; each draw is added once (by date);
// only draws newer than the latest stored draw are added. Run: node tools/fetch_results.mjs [--dry] [game ...]
import fs from 'node:fs';

const FILE = 'public/data/results.json';
const DRY = process.argv.includes('--dry');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const LG = 'https://lotteryguru.com/';
const LG_URL = {
  singapore: LG + 'singapore-lottery-results/sg-4d/sg-4d-results-history',
  toto: LG + 'malaysia-lottery-results/my-sports-toto-4d/my-sports-toto-4d-results-history',
  magnum: LG + 'malaysia-lottery-results/my-magnum-4d/my-magnum-4d-results-history',
  damacai: LG + 'malaysia-lottery-results/my-damacai-4d/my-damacai-4d-results-history',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, headers = {}) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*', ...headers }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r;
}

const is4 = (s) => typeof s === 'string' && /^\d{4}$/.test(s);
const pad = (s) => String(s).trim().padStart(4, '0');
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Build a draw from 23 numbers: 1st, 2nd, 3rd, 10 starters, 10 consolation. Returns null if anything is off.
function build(date, drawNo, nums) {
  if (!Array.isArray(nums) || nums.length !== 23 || !nums.every(is4)) return null;
  const [first, second, third, ...rest] = nums;
  const special = rest.slice(0, 10).sort();
  const consolation = rest.slice(10).sort();
  return { date, drawNo: drawNo ? String(drawNo) : '', first, second, third, special, consolation };
}

// ---- 4dpredict.app home page (MAIN source for all 5 games; shows the latest draw of each) ----
const P4D_URL = 'https://www.4dpredict.app/';
const P4D_TITLE = {
  magnum: /^MAGNUM 4D Classic/i,
  toto: /^TOTO 4D/i,
  damacai: /^DAMACAI 1\+3D/i,
  singapore: /^SINGAPORE POOLS/i,
  gdlotto: /^GRAND DRAGON LOTTO(?!\s*6D)/i,
};
let p4dCache = null;
export function parse4dPredict(html) {
  const out = {};
  for (const part of html.split('<span class="lottery-title">').slice(1)) {
    const title = part.slice(0, part.indexOf('</span>')).trim();
    const game = Object.keys(P4D_TITLE).find((g) => P4D_TITLE[g].test(title));
    if (!game || out[game]) continue;
    const dm = part.match(/[?&]d=(\d{4}-\d{2}-\d{2})/);
    const iSp = part.search(/>\s*SPECIAL\s*</i);
    const iCo = part.search(/>\s*CONSOLATION\s*</i);
    if (!dm || iSp < 0 || iCo < iSp) continue;
    const cells = (x) => [...x.matchAll(/<td[^>]*>\s*(\d{4})\s*<\/td>/g)].map((m) => m[1]);
    const top = cells(part.slice(0, iSp)).slice(0, 3);
    const sp = cells(part.slice(iSp, iCo));
    const tail = part.slice(iCo + 20);
    const stop = tail.search(/class="table-container|<\/section/);
    const co = cells(stop > 0 ? tail.slice(0, stop) : tail);
    const d = build(dm[1], '', [...top, ...sp.slice(0, 10), ...co.slice(0, 10)]);
    if (d && sp.length === 10 && co.length === 10) out[game] = [d];
  }
  return out;
}
async function from4dPredict(game) {
  if (!p4dCache) { const r = await get(P4D_URL); p4dCache = parse4dPredict(await r.text()); }
  return p4dCache[game] || [];
}

// ---- lotteryguru history page (Toto, Singapore; also used as a fallback for Magnum/Damacai) ----
function parseLotteryGuru(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
  const re = /(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/g;
  const heads = [];
  let m;
  while ((m = re.exec(text))) heads.push({ idx: m.index, end: re.lastIndex, d: +m[1], mon: MON[m[2].toLowerCase()], y: +m[3] });
  const out = [];
  heads.forEach((h, i) => {
    if (!h.mon) return;
    const body = text.slice(h.end, i + 1 < heads.length ? heads[i + 1].idx : h.end + 4000);
    const toks = body.split(/\s+/).filter(Boolean);
    const nums = [];
    let acc = '';
    for (const t of toks) {
      if (/^\d{4}$/.test(t)) { acc = ''; nums.push(t); } else if (/^\d$/.test(t)) { acc += t; if (acc.length === 4) { nums.push(acc); acc = ''; } } else if (acc) { acc = ''; }
    }
    const d = build(iso(h.y, h.mon, h.d), '', nums);
    if (d) out.push(d);
  });
  return out;
}
async function fromLotteryGuru(game) {
  const r = await get(LG_URL[game]);
  return parseLotteryGuru(await r.text());
}

// ---- Magnum 4D official JSON ----
async function fromMagnum() {
  const today = new Date().toISOString().slice(0, 10);
  const r = await get(`https://www.magnum4d.my/results/past/between-dates/null/${today}/12`, { accept: 'application/json' });
  const j = await r.json();
  const rows = Array.isArray(j) ? j : j.data || j.Data || j.results || [];
  const out = [];
  for (const x of rows) {
    const [dd, mm, yy] = String(x.DrawDate || '').split(/[\/-]/);
    if (!yy) continue;
    const key = (re) => Object.keys(x).filter((k) => re.test(k)).sort((a, b) => parseInt(a.replace(/\D/g, '') || 0) - parseInt(b.replace(/\D/g, '') || 0));
    const sp = key(/^Special\d+$/i).map((k) => pad(x[k]));
    const co = key(/^(Console|Consolation)\d+$/i).map((k) => pad(x[k]));
    const d = build(iso(yy.length === 2 ? '20' + yy : yy, +mm, +dd), x.DrawID, [pad(x.FirstPrize), pad(x.SecondPrize), pad(x.ThirdPrize), ...sp, ...co]);
    if (d) out.push(d);
  }
  return out;
}

// ---- Da Ma Cai official ----
async function fromDamacai() {
  const out = [];
  const now = new Date();
  for (let back = 0; back < 8; back++) {
    const dt = new Date(now.getTime() - back * 86400000);
    const ymd = dt.toISOString().slice(0, 10).replace(/-/g, '');
    try {
      const r = await get(`https://www.damacai.com.my/callpassresult?pastdate=${ymd}`, { cookiesession: '57' });
      const link = (await r.json()).link;
      if (!link) continue;
      const j = await (await get(link)).json();
      const arr = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).filter(Boolean).map(pad);
      const ds = String(j.drawDate || '');
      const mm = ds.match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/) || [];
      if (!mm[1]) continue;
      const d = build(iso(mm[1], +mm[2], +mm[3]), j.drawNo, [pad(j.p1), pad(j.p2), pad(j.p3), ...arr(j.starterList), ...arr(j.consolidateList)]);
      if (d && !out.find((o) => o.date === d.date)) out.push(d);
    } catch (e) { /* no draw that day */ }
    await sleep(400);
  }
  return out;
}

// Order = priority. 4dpredict.app is the main source; the rest are backups (and fill any missed older draws).
const SOURCES = {
  magnum: [() => from4dPredict('magnum'), fromMagnum, () => fromLotteryGuru('magnum')],
  damacai: [() => from4dPredict('damacai'), fromDamacai, () => fromLotteryGuru('damacai')],
  toto: [() => from4dPredict('toto'), () => fromLotteryGuru('toto')],
  singapore: [() => from4dPredict('singapore'), () => fromLotteryGuru('singapore')],
  gdlotto: [() => from4dPredict('gdlotto')], // admin page manual entry is still merged in the app as a backup
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let changed = false;
const report = [];
for (const game of Object.keys(SOURCES)) {
  if (ONLY.length && !ONLY.includes(game)) continue;
  const have = data.games[game] || [];
  const latest = have.length ? have[0].date : '0000-00-00';
  let found = null;
  let any = false;
  for (const src of SOURCES[game]) {
    try {
      const res = await src();
      console.log(`[${game}] source returned ${res.length} complete draws`);
      if (res.length) { any = true; found = [...(found || []), ...res]; if (res.some((d) => d.date > latest)) break; }
    } catch (e) { console.log(`[${game}] source failed: ${e.message}`); }
    await sleep(800);
  }
  if (!any) { report.push(`${game}: no data`); continue; }
  { const seen = new Set(); found = found.filter((d) => (seen.has(d.date) ? false : (seen.add(d.date), true))); } // first source wins per date
  // guard: a "new" draw with exactly the same numbers as a recent stored draw is a stale page, not a real result
  const sig = (d) => [d.first, d.second, d.third, ...d.special, ...d.consolation].join(',');
  const recent = new Set(have.slice(0, 10).map(sig));
  const fresh = found.filter((d) => d.date > latest && !have.some((h) => h.date === d.date) && !recent.has(sig(d)));
  if (!fresh.length) { report.push(`${game}: up to date (${latest})`); continue; }
  fresh.sort((a, b) => (a.date < b.date ? 1 : -1));
  data.games[game] = [...fresh, ...have].slice(0, 400);
  changed = true;
  report.push(`${game}: +${fresh.length} (${fresh.map((d) => d.date).join(', ')})`);
}
console.log(report.join('\n'));
if (changed && !DRY) {
  data.updated = new Date().toISOString();
  fs.writeFileSync(FILE, JSON.stringify(data));
  console.log('results.json updated');
} else if (changed) console.log('(dry run: not written)');
