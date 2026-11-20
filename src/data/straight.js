// Straight chart: 4 columns (A B C D) x 4 rows built from the 7 most frequent digits of a game's history.
// Pure functions (also used by tools/demo_straight.mjs to make dummy winning data).
import { analyze } from './analysis.js';

export function prizeList(draw) {
  const out = [];
  if (draw.first) out.push({ prize: '1st', number: draw.first });
  if (draw.second) out.push({ prize: '2nd', number: draw.second });
  if (draw.third) out.push({ prize: '3rd', number: draw.third });
  (draw.special || []).forEach((n) => out.push({ prize: 'Special', number: n }));
  (draw.consolation || []).forEach((n) => out.push({ prize: 'Consolation', number: n }));
  return out;
}

function rng(seedStr) { // seeded random so the chart stays the same for one draw
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let x = Math.imul(h ^ (h >>> 15), 1 | h); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// A digit never repeats inside one column; the same digit may appear in different columns.
export function straightChart(draws, seed) {
  const s = analyze(draws);
  const top7 = s.digit.map((c, d) => [d, c]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 7).map((x) => x[0]);
  const r = rng(seed);
  const cols = [0, 1, 2, 3].map(() => shuffle(top7, r).slice(0, 4));
  return { top7, cols };
}

// a prize number wins when its 1st digit is in column A, 2nd in B, 3rd in C and 4th in D (any row)
export function straightWins(cols, draw) {
  if (!draw) return [];
  return prizeList(draw).filter((e) => /^\d{4}$/.test(e.number) && e.number.split('').every((d, i) => cols[i].includes(Number(d))));
}
