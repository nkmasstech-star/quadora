import { GAMES } from './games.js';

const BASE = 'https://raw.githubusercontent.com/nkmasstech-star/quadora/main/public/data/';

async function getJson(name) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    if (import.meta.env.DEV) throw new Error('dev uses bundled data');
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

// Manual draws entered on the admin page live in one small public Firestore document (read over plain REST, no SDK).
const FS_URL = 'https://firestore.googleapis.com/v1/projects/qspot4d/databases/(default)/documents/pub/manual?key=AIzaSyB-F6_5oWWZK4v6n5krWUBNSQvIMMBHk5g';
async function getManual() {
  if (import.meta.env.DEV) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(FS_URL, { signal: ctrl.signal });
    if (!r.ok) return null;
    const j = await r.json();
    const raw = j && j.fields && j.fields.json && j.fields.json.stringValue;
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
// Manual draws win on the same date (so a correction replaces a wrong number); everything is shown newest first.
function mergeManual(results, manual) {
  if (!results || !manual || !manual.games) return results;
  const games = { ...results.games };
  Object.keys(manual.games).forEach((g) => {
    const extra = (manual.games[g] || []).filter((d) => d && d.date && d.first && (d.special || []).length === 10 && (d.consolation || []).length === 10);
    if (!extra.length) return;
    const dates = new Set(extra.map((d) => d.date));
    games[g] = [...extra, ...(games[g] || []).filter((d) => !dates.has(d.date))].sort((a, b) => (a.date < b.date ? 1 : -1));
  });
  return { ...results, games };
}

export async function loadAll() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
    const m = await import('../dev/demo.json');
    const t = new Date(); m.default.results.games.magnum[0].date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return { results: m.default.results, predictions: m.default.predictions, winnings: null, demo: true };
  }
  const [base, predictions, predHistory, announcements, manual] = await Promise.all([getJson('results.json'), getJson('predictions.json'), getJson('pred_history.json'), getJson('announcements.json'), getManual()]);
  const results = mergeManual(base, manual);
  return { results, predictions, predHistory, announcements: Array.isArray(announcements) ? announcements : [], demo: false };
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

const norm4 = (s) => String(s).split('').sort().join('');
// Win check (same rule as the daily task): the 6 predictions match any prize in any digit order;
// the 2 Top-3 picks are checked against 1st/2nd/3rd only.
export function checkPrediction(pred, draw) {
  const wins = [];
  if (!pred || !draw) return wins;
  const all = prizeEntries(draw);
  (pred.numbers || []).forEach((n) => {
    all.forEach((e) => { if (norm4(e.number) === norm4(n)) wins.push({ number: n, prize: e.prize, got: e.number, kind: '4D' }); });
  });
  (pred.top3 || []).forEach((n) => {
    all.filter((e) => ['1st', '2nd', '3rd'].includes(e.prize)).forEach((e) => { if (norm4(e.number) === norm4(n)) wins.push({ number: n, prize: e.prize, got: e.number, kind: 'Top3' }); });
  });
  return wins;
}

// Every win across all games from the stored prediction history, newest first.
export function allWins(data) {
  const out = [];
  GAMES.forEach((g) => {
    const rows = (data.predHistory && data.predHistory.games && data.predHistory.games[g.id]) || [];
    rows.forEach((p) => {
      const d = drawsOf(data.results, g.id).find((x) => x.date === p.forDate);
      checkPrediction(p, d).forEach((w) => out.push({ game: g.id, date: p.forDate, ...w }));
    });
  });
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}
