// TEST voting layer: the votes of other players are DUMMY numbers made from the game and date.
// With Firebase (Firestore) the totals come from the real votes; the screens do not change.
import { gameById, drawStartMs } from './rules.js';
import { DRAW_TIMES } from '../config.js';

const MS_H = 3600e3;
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dowOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

// next draw whose start is still in the future (votes are for this draw)
export function pollDraw(gameId, now = Date.now()) {
  const g = gameById(gameId);
  const dt = DRAW_TIMES[gameId] || { utc: 8 };
  const opToday = new Date(now + dt.utc * MS_H).toISOString().slice(0, 10);
  for (let i = 0; i < 9; i += 1) {
    const date = addDays(opToday, i);
    if (g.days.includes(dowOf(date)) && drawStartMs(gameId, date) > now) return date;
  }
  return opToday;
}

const key = (uid) => `qd_vote_${uid}`;
const read = (uid) => { try { return JSON.parse(localStorage.getItem(key(uid))) || {}; } catch (e) { return {}; } };
export const myVote = (uid, gameId) => read(uid)[`${gameId}|${pollDraw(gameId)}`] || null;
export function castVote(uid, gameId, digits) {
  const v = read(uid);
  const k = `${gameId}|${pollDraw(gameId)}`;
  if (v[k]) return false; // one vote per game per draw
  v[k] = digits;
  try { localStorage.setItem(key(uid), JSON.stringify(v)); } catch (e) { /* ignore */ }
  return true;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// counts[pos][digit] and percentages; includes the player's own vote
export function tally(gameId, mine) {
  const r = rng(hash(`${gameId}|${pollDraw(gameId)}`));
  const counts = [0, 1, 2, 3].map(() => Array.from({ length: 10 }, () => Math.floor(40 + r() * 260)));
  if (mine) mine.split('').forEach((d, i) => { counts[i][Number(d)] += 1; });
  const pct = counts.map((row) => { const s = row.reduce((a, b) => a + b, 0); return row.map((c) => Math.round((c / s) * 1000) / 10); });
  const top = counts.map((row) => row.indexOf(Math.max(...row)));
  const total = counts[0].reduce((a, b) => a + b, 0);
  return { pct, top, total };
}
