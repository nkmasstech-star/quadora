// Voting layer: one vote per player per game per draw; totals are the real votes of all players (Firestore, see cloud.js).
import { gameById, drawStartMs } from './rules.js';
import { DRAW_TIMES } from '../config.js';
import { C, watchPoll, cloudVote, cloudMyVote } from './cloud.js';

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
const pk = (gameId) => `${gameId}_${pollDraw(gameId)}`;
export const myVote = (uid, gameId) => {
  const k = `${gameId}|${pollDraw(gameId)}`;
  const v = read(uid)[k];
  if (!v) { // new phone or cleared data: ask the server once
    cloudMyVote(uid, pk(gameId)).then((d) => { if (d) { const all = read(uid); all[k] = d; try { localStorage.setItem(key(uid), JSON.stringify(all)); } catch (e) { /* ignore */ } window.dispatchEvent(new Event('qd-data')); } });
  }
  return v || null;
};
export function castVote(uid, gameId, digits) {
  const v = read(uid);
  const k = `${gameId}|${pollDraw(gameId)}`;
  if (v[k]) return false; // one vote per game per draw
  v[k] = digits;
  try { localStorage.setItem(key(uid), JSON.stringify(v)); } catch (e) { /* ignore */ }
  cloudVote(uid, pk(gameId), digits).catch(() => { delete v[k]; try { localStorage.setItem(key(uid), JSON.stringify(v)); } catch (e) { /* ignore */ } window.dispatchEvent(new CustomEvent('qd-cloud-error', { detail: 'vote' })); window.dispatchEvent(new Event('qd-data')); });
  return true;
}

// counts[pos][digit] and percentages from the real votes (zeros until the first vote arrives)
export function tally(gameId) {
  const k = pk(gameId);
  watchPoll(k);
  const d = C.polls[k] || {};
  const counts = [0, 1, 2, 3].map((i) => Array.from({ length: 10 }, (_, n) => Number(d[`c${i}_${n}`]) || 0));
  const total = counts[0].reduce((a, b) => a + b, 0);
  const pct = counts.map((row) => { const s = row.reduce((a, b) => a + b, 0) || 1; return row.map((c) => Math.round((c / s) * 1000) / 10); });
  const top = counts.map((row) => row.indexOf(Math.max(...row)));
  return { pct, top, total };
}
