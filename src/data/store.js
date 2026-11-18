import { GAMES } from './games.js';

const BASE = 'https://raw.githubusercontent.com/nkmasstech-star/quadora/main/public/data/';

async function getJson(name) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const bucket = Math.floor(Date.now() / 300000);
    const r = await fetch(`${BASE}${name}?v=${bucket}`, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } catch (e) {
    try {
      const r2 = await fetch(`./data/${name}`);
      if (r2.ok) return await r2.json();
    } catch (e2) {
      /* offline and nothing bundled */
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadAll() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
    const m = await import('../dev/demo.json');
    const t = new Date(); m.default.results.games.magnum[0].date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return { results: m.default.results, predictions: m.default.predictions, winnings: null, demo: true };
  }
  const [results, predictions, winnings] = await Promise.all([getJson('results.json'), getJson('predictions.json'), getJson('winnings.json')]);
  return { results, predictions, winnings, demo: false };
}

export const drawsOf = (results, gameId) => (results && results.games && results.games[gameId]) || [];
export const latestOf = (results, gameId) => drawsOf(results, gameId)[0] || null;

const norm = (s) => String(s).split('').sort().join('');

export function prizeEntries(draw) {
  const out = [];
  if (draw.first) out.push({ prize: '1st', number: draw.first });
  if (draw.second) out.push({ prize: '2nd', number: draw.second });
  if (draw.third) out.push({ prize: '3rd', number: draw.third });
  (draw.special || []).forEach((n) => out.push({ prize: 'Special', number: n }));
  (draw.consolation || []).forEach((n) => out.push({ prize: 'Consolation', number: n }));
  return out;
}

// Search every stored draw for a 4-digit number. anyOrder = same digits in any order.
export function searchHistory(results, query, anyOrder, gameId) {
  if (!results || query.length !== 4) return [];
  const hits = [];
  GAMES.forEach((g) => {
    if (gameId && gameId !== 'all' && gameId !== g.id) return;
    drawsOf(results, g.id).forEach((draw) => {
      prizeEntries(draw).forEach((e) => {
        const match = anyOrder ? norm(e.number) === norm(query) : e.number === query;
        if (match) hits.push({ game: g, draw, prize: e.prize, number: e.number });
      });
    });
  });
  hits.sort((a, b) => (a.draw.date < b.draw.date ? 1 : -1));
  return hits;
}

export function totalDraws(results) {
  return GAMES.reduce((n, g) => n + drawsOf(results, g.id).length, 0);
}
