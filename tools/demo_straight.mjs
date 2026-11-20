// DUMMY DATA ONLY: gives GD Lotto draws for 19 and 20 Nov and makes today's draw contain 3 Straight winners,
// so the Straight page can be shown with a finished draw. Run after make_dummy.py:  node tools/demo_straight.mjs
import fs from 'fs';
import { straightChart, straightWins } from '../src/data/straight.js';

const file = new URL('../public/data/results.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const list = d.games.gdlotto;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const n4 = () => String(Math.floor(rnd() * 10000)).padStart(4, '0');
const mk = (date, no) => ({ date, drawNo: String(no), first: n4(), second: n4(), third: n4(), special: Array.from({ length: 10 }, n4), consolation: Array.from({ length: 10 }, n4) });
const have = new Set(list.map((x) => x.date));
const lastNo = Number(list[0].drawNo);
if (!have.has('2026-11-19')) list.unshift(mk('2026-11-19', lastNo + 1));
if (!have.has('2026-11-20')) list.unshift(mk('2026-11-20', lastNo + 2));
list.sort((a, b) => (a.date < b.date ? 1 : -1));
const today = list[0];
const { cols } = straightChart(list.slice(1), `gdlotto${today.date}`);
const pick = () => cols.map((c) => c[Math.floor(rnd() * 4)]).join('');
const strip = (a) => a.filter((n) => straightWins(cols, { special: [n] }).length === 0); // clear random accidental winners
today.special = strip(today.special); today.consolation = strip(today.consolation);
while (today.special.length < 10) { const n = n4(); if (!straightWins(cols, { special: [n] }).length) today.special.push(n); }
while (today.consolation.length < 10) { const n = n4(); if (!straightWins(cols, { special: [n] }).length) today.consolation.push(n); }
today.special[2] = pick(); today.special[6] = pick(); today.consolation[4] = pick();
d.updated = new Date().toISOString();
fs.writeFileSync(file, JSON.stringify(d));
console.log('GD Lotto', today.date, 'winners:', straightWins(cols, today).map((w) => `${w.number} ${w.prize}`).join(', '));
