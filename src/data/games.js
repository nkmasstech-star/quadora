// Draw days: 0 = Sunday ... 6 = Saturday. Malaysian/Singapore games draw Wed, Sat, Sun
// (plus occasional special draws); Grand Dragon Lotto draws daily.
export const GAMES = [
  { id: 'magnum', name: 'Magnum 4D', region: 'Malaysia', special: 'Special', days: [3, 6, 0] },
  { id: 'toto', name: 'Sports Toto 4D', region: 'Malaysia', special: 'Starter', days: [3, 6, 0] },
  { id: 'damacai', name: 'Da Ma Cai 1+3D', region: 'Malaysia', special: 'Starter', days: [3, 6, 0] },
  { id: 'singapore', name: 'Singapore 4D', region: 'Singapore', special: 'Starter', days: [3, 6, 0] },
  { id: 'gdlotto', name: 'Grand Dragon Lotto', region: 'Cambodia', special: 'Starter', days: [0, 1, 2, 3, 4, 5, 6] },
];

export const gameById = (id) => GAMES.find((g) => g.id === id);

import { t, getLang, dayName, monthName } from '../i18n.js';

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(dateOrIso) {
  const d = typeof dateOrIso === 'string' ? parseDate(dateOrIso) : dateOrIso;
  if (getLang() === 'zh') return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${dayName(d.getDay())}`;
  return `${dayName(d.getDay())}, ${d.getDate()} ${monthName(d.getMonth())} ${d.getFullYear()}`;
}

export function fmtShort(dateOrIso) {
  const d = typeof dateOrIso === 'string' ? parseDate(dateOrIso) : dateOrIso;
  if (getLang() === 'zh') return `${d.getMonth() + 1}月${d.getDate()}日 ${dayName(d.getDay())}`;
  return `${dayName(d.getDay())}, ${d.getDate()} ${monthName(d.getMonth())}`;
}

export function nextDraw(game) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 8; i += 1) {
    const x = new Date(base);
    x.setDate(base.getDate() + i);
    if (game.days.includes(x.getDay())) return { date: x, today: i === 0 };
  }
  return null;
}

export function nextDrawLabel(game) {
  const n = nextDraw(game);
  if (!n) return '';
  return n.today ? t('Today') : fmtShort(n.date);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
