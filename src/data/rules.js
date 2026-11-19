// Draw timing + prediction auto-update rules (shared by the app and the future data pipeline).
import { GAMES } from './games.js';
import { DRAW_TIMES, EDIT_BEFORE_HOURS } from '../config.js';

const MS_H = 3600e3;
export const gameById = (id) => GAMES.find((g) => g.id === id);

// UTC milliseconds when a game's draw on dateISO (YYYY-MM-DD, operator's local date) starts.
export function drawStartMs(gameId, dateISO) {
  const dt = DRAW_TIMES[gameId] || { h: 19, m: 0, utc: 8 };
  const [y, mo, d] = dateISO.split('-').map(Number);
  return Date.UTC(y, mo - 1, d, dt.h, dt.m) - dt.utc * MS_H;
}
export const cutoffMs = (gameId, dateISO) => drawStartMs(gameId, dateISO) - EDIT_BEFORE_HOURS * MS_H;

const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dowOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

// The next draw a player can still post/save for: the first draw whose edit cut-off is still in the future.
export function targetDraw(gameId, now = Date.now()) {
  const g = gameById(gameId);
  const dt = DRAW_TIMES[gameId] || { utc: 8 };
  const opToday = new Date(now + dt.utc * MS_H).toISOString().slice(0, 10);
  for (let i = 0; i < 9; i += 1) {
    const date = addDays(opToday, i);
    if (g.days.includes(dowOf(date)) && cutoffMs(gameId, date) > now) return date;
  }
  return opToday;
}

// How long after a result before the next prediction is published (hours).
//   next draw is the very next day -> 2h ; next draw is a special draw -> 12h ; otherwise (regular, 2+ days away) -> 24h
export function updateDelayHours(resultDate, nextDrawDate, nextIsSpecial) {
  const gap = Math.round((Date.parse(nextDrawDate) - Date.parse(resultDate)) / 86400e3);
  if (gap <= 1) return 2;
  if (nextIsSpecial) return 12;
  return 24;
}
