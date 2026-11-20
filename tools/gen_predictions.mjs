// Real prediction generator for Q Spot 4D (entertainment only - no guarantee).
// Port of Nehru's locked formula (gd_predict.py, "Nehroopa" daily task). Reads public/data/results.json,
// writes public/data/predictions.json, pred_history.json, winnings.json. Run by the fetch-results workflow.
//
// Formula (per game, from its latest full result):
//  1. Digit frequency over all 23 prizes. Bottom 3 (lowest frequency) digits; ties follow the website table
//     (a digit that first appears later in the result order sits lower).
//  2. Important 3-digit (2 sets): Big = 5-9, Small = 0-4.
//       3 Big or 3 Small -> double the largest digit; 1 Big + 2 Small -> double the Big; 2 Big + 1 Small -> double the Small.
//  3. 4-digit predictions: 3 per set (6 total); the added digit is not in the set; final number = 3 Big + 1 Small or 3 Small + 1 Big.
//  4. Chart 3 rows x 4 cols: every prediction is a connected up/down/left/right line, random place, others filler.
//  5. Top 3: digits of 1st/2nd/3rd only; 3 least-frequent digits; 2 numbers, one digit doubled, random order.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const read = (n, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, n), 'utf8')); } catch (e) { return d; } };
const write = (n, o) => fs.writeFileSync(path.join(DATA, n), JSON.stringify(o));

const GAMES = [
  { id: 'magnum', days: [3, 6, 0], h: 19, m: 0, utc: 8 },
  { id: 'toto', days: [3, 6, 0], h: 19, m: 0, utc: 8 },
  { id: 'damacai', days: [3, 6, 0], h: 19, m: 0, utc: 8 },
  { id: 'singapore', days: [3, 6, 0], h: 18, m: 30, utc: 8 },
  { id: 'gdlotto', days: [0, 1, 2, 3, 4, 5, 6], h: 19, m: 15, utc: 7 },
];

// ---------- seeded random ----------
function rngFrom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return {
    next,
    choice: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => { for (let i = arr.length - 1; i > 0; i -= 1) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } },
  };
}

const isBig = (d) => d >= 5;

function bottom3(counts, rng, nums) {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (nums) {
    const seq = nums.join('');
    const first = {};
    digits.forEach((d) => { const i = seq.indexOf(String(d)); first[d] = i < 0 ? 1e6 : i; });
    digits.sort((a, b) => (counts[a] - counts[b]) || (first[b] - first[a]));
  } else {
    rng.shuffle(digits);
    digits.sort((a, b) => counts[a] - counts[b]);
  }
  return digits.slice(0, 3);
}

function importantSets(three) {
  const bigs = three.filter(isBig);
  const smalls = three.filter((d) => !isBig(d));
  let D;
  if (bigs.length === 0 || bigs.length === 3) D = Math.max(...three);
  else if (bigs.length === 1) D = bigs[0];
  else D = smalls[0];
  const others = three.filter((d) => d !== D).sort((a, b) => b - a);
  return { D, sets: others.map((o) => [D, D, o]) };
}

function fourDigitPool(s) {
  const nb = s.filter(isBig).length;
  const needBig = nb === 0 || nb === 2;
  const range = needBig ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4];
  return range.filter((d) => !s.includes(d));
}

const R = 3; const C = 4;
const CELLS = []; for (let r = 0; r < R; r += 1) for (let c = 0; c < C; c += 1) CELLS.push([r, c]);
const key = (c) => `${c[0]},${c[1]}`;
const nbrs = (c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => [c[0] + a, c[1] + b]).filter(([r, cc]) => r >= 0 && r < R && cc >= 0 && cc < C);

function place(grid, multiset, rng) {
  const starts = CELLS.slice(); rng.shuffle(starts);
  const results = [];
  const dfs = (p, remaining) => {
    if (!remaining.length) { results.push(p.slice()); return; }
    const last = p[p.length - 1];
    const nb = nbrs(last); rng.shuffle(nb);
    for (const n of nb) {
      if (p.some((x) => key(x) === key(n))) continue;
      const v = grid.get(key(n));
      const opts = v !== undefined ? [v] : [...new Set(remaining)];
      for (const d of opts) {
        if (remaining.includes(d)) {
          const rem = remaining.slice(); rem.splice(rem.indexOf(d), 1);
          dfs([...p, n], rem);
          if (results.length > 40) return;
        }
      }
    }
  };
  for (const s of starts) {
    const v = grid.get(key(s));
    for (const d of (v !== undefined ? [v] : [...new Set(multiset)])) {
      if (multiset.includes(d)) { const rem = multiset.slice(); rem.splice(rem.indexOf(d), 1); dfs([s], rem); }
    }
  }
  if (!results.length) return null;
  const reuse = (p) => p.filter((c) => grid.has(key(c))).length;
  results.sort((a, b) => reuse(b) - reuse(a));
  const best = results.filter((p) => reuse(p) === reuse(results[0]));
  return rng.choice(best);
}

export function buildPrediction(draw, seed) {
  const rng = rngFrom(seed);
  const nums = [draw.first, draw.second, draw.third, ...(draw.special || []), ...(draw.consolation || [])].filter((n) => /^\d{4}$/.test(String(n)));
  const counts = Array(10).fill(0);
  nums.forEach((n) => n.split('').forEach((ch) => { counts[Number(ch)] += 1; }));
  const three = bottom3(counts, rng, nums);
  const { D, sets } = importantSets(three);

  let grid; let preds; let done = false;
  for (let attempt = 0; attempt < 3000 && !done; attempt += 1) {
    grid = new Map(); preds = []; let ok = true;
    for (const s of sets) {
      const pool = fourDigitPool(s); rng.shuffle(pool);
      for (const add of pool.slice(0, 3)) {
        if (preds.length >= 6) break;
        const ms0 = [...s, add];
        const p = place(grid, ms0, rng);
        if (!p) { ok = false; break; }
        const ms = ms0.slice();
        p.forEach((cell) => { if (grid.has(key(cell))) ms.splice(ms.indexOf(grid.get(key(cell))), 1); });
        p.forEach((cell) => { if (!grid.has(key(cell))) { const d = rng.choice(ms); grid.set(key(cell), d); ms.splice(ms.indexOf(d), 1); } });
        preds.push(p.map((c) => grid.get(key(c))).join(''));
      }
      if (!ok) break;
    }
    if (ok && preds.length === 6) {
      const vals = [...grid.values()];
      const cnt = Array(10).fill(0); vals.forEach((v) => { cnt[v] += 1; });
      if (Math.max(...cnt) <= 2 && preds.every((p) => p.includes(String(D).repeat(2))) && new Set(vals).size + (12 - grid.size) >= 10) done = true;
    }
  }
  if (!done) throw new Error(`chart could not be built for seed ${seed}`);

  const gc = Array(10).fill(0); [...grid.values()].forEach((v) => { gc[v] += 1; });
  const missing = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => gc[d] === 0);
  const once = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => gc[d] === 1);
  rng.shuffle(missing); rng.shuffle(once);
  const filler = [...missing, ...once];
  const empty = CELLS.filter((c) => !grid.has(key(c))); rng.shuffle(empty);
  empty.forEach((cell, i) => { if (i < filler.length) grid.set(key(cell), filler[i]); else grid.set(key(cell), rng.choice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])); });
  const chart = []; for (let r = 0; r < R; r += 1) for (let c = 0; c < C; c += 1) chart.push(grid.get(key([r, c])));

  const topCounts = Array(10).fill(0);
  nums.slice(0, 3).forEach((n) => n.split('').forEach((ch) => { topCounts[Number(ch)] += 1; }));
  const t3 = bottom3(topCounts, rng);
  const tops = new Set();
  while (tops.size < 2) { const digs = [...t3, rng.choice(t3)]; rng.shuffle(digs); tops.add(digs.join('')); }

  return { important3: sets, numbers: preds, top3: [...tops].sort(), chart };
}

// ---------- dates ----------
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const nextDrawDate = (g, iso) => { for (let i = 1; i <= 8; i += 1) { const d = addDays(iso, i); if (g.days.includes(dow(d))) return d; } return addDays(iso, 1); };
const drawStartMs = (g, iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d, g.h, g.m) - g.utc * 3600e3; };
// Publish delay after a result: next draw is the very next day -> 2h; otherwise 24h (special-draw 12h needs the special-draw calendar).
const delayH = (resultIso, nextIso) => (Math.round((Date.parse(nextIso) - Date.parse(resultIso)) / 86400e3) <= 1 ? 2 : 24);

// ---------- main ----------
const results = read('results.json', null);
if (!results || !results.games) { console.log('no results.json'); process.exit(0); }
const oldPred = read('predictions.json', null);
const oldHist = read('pred_history.json', null);
const realOld = oldPred && !oldPred.dummy ? oldPred : null;
const hist = oldHist && !oldHist.dummy ? oldHist : { games: {} };
const now = Date.now();
const outGames = {};
let changed = false;

for (const g of GAMES) {
  const draws = (results.games[g.id] || []).filter((d) => d && d.date && d.first && (d.special || []).length === 10 && (d.consolation || []).length === 10);
  draws.sort((a, b) => (a.date < b.date ? 1 : -1));
  const L = draws[0];
  const cur = realOld && realOld.games && realOld.games[g.id];
  if (!L) { if (cur) outGames[g.id] = cur; continue; }
  if (cur && cur.basedOn === L.date) { outGames[g.id] = cur; continue; } // already made from the latest result
  const nextIso = nextDrawDate(g, L.date);
  const publishAt = drawStartMs(g, L.date) + delayH(L.date, nextIso) * 3600e3;
  if (cur && now < publishAt) { outGames[g.id] = cur; continue; } // waiting for the publish delay; keep the current one
  const p = buildPrediction(L, `${L.date}-${g.id}`);
  outGames[g.id] = { forDate: nextIso, basedOn: L.date, ...p };
  if (cur && cur.forDate) { // move the old prediction into history (once)
    const rows = (hist.games[g.id] || []).filter((r) => r.forDate !== cur.forDate);
    rows.unshift({ forDate: cur.forDate, important3: cur.important3, numbers: cur.numbers, top3: cur.top3, chart: cur.chart });
    hist.games[g.id] = rows.sort((a, b) => (a.forDate < b.forDate ? 1 : -1)).slice(0, 30);
  }
  changed = true;
  console.log(`[${g.id}] new prediction for ${nextIso} from the ${L.date} result: ${p.numbers.join(' ')} | top3 ${p.top3.join(' ')} | imp ${p.important3.map((s) => s.join('')).join(' ')}`);
}

if (!realOld || changed) {
  write('predictions.json', { dummy: false, updated: new Date().toISOString(), games: outGames });
  write('pred_history.json', { dummy: false, games: hist.games });
  // winnings.json is kept for compatibility; the app computes wins from pred_history + results
  const norm = (s) => String(s).split('').sort().join('');
  const wins = [];
  for (const g of GAMES) {
    for (const p of hist.games[g.id] || []) {
      const d = (results.games[g.id] || []).find((x) => x.date === p.forDate);
      if (!d) continue;
      const all = [['1st', d.first], ['2nd', d.second], ['3rd', d.third], ...(d.special || []).map((n) => ['Special', n]), ...(d.consolation || []).map((n) => ['Consolation', n])];
      (p.numbers || []).forEach((n) => all.forEach(([prize, got]) => { if (got && norm(got) === norm(n)) wins.push({ game: g.id, date: p.forDate, number: n, prize }); }));
    }
  }
  write('winnings.json', { dummy: false, wins });
  console.log(changed ? 'predictions updated' : 'dummy data replaced');
} else {
  console.log('predictions unchanged');
}
