import { gameById, GAMES, fmtShort, todayISO } from '../data/games.js';
import { Loading, BackBar, Panel } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { IconChevron, Logo } from '../icons.jsx';
import { drawsOf } from '../data/store.js';
import { analyze } from '../data/analysis.js';

const LETTER = { magnum: 'M', toto: 'T', damacai: 'D', singapore: 'S', gdlotto: 'G' };
const shortName = (g) => (g.id === 'gdlotto' ? 'GD Lotto' : g.name);

// next draw date (ISO) that has no result yet
function nextDrawISO(g, draws) {
  const done = new Set(draws.map((d) => d.date));
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 9; i += 1) {
    const x = new Date(base); x.setDate(base.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    if (g.days.includes(x.getDay()) && !done.has(iso)) return iso;
  }
  return todayISO();
}

function rng(seedStr) { // small seeded random so the chart stays the same for one draw
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let x = Math.imul(h ^ (h >>> 15), 1 | h); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 4 columns (A B C D) x 4 rows. The 7 most frequent digits of the history are placed at random;
// a digit never repeats inside one column.
export function straightChart(draws, seed) {
  const s = analyze(draws);
  const top7 = s.digit.map((c, d) => [d, c]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 7).map((x) => x[0]);
  const r = rng(seed);
  const cols = [0, 1, 2, 3].map(() => shuffle(top7, r).slice(0, 4));
  return { top7, cols };
}

export function StraightList({ data }) {
  if (data.status === 'loading' && !data.results) return <Loading />;
  return (
    <div>
      <BackBar title={t('Straight Predictions')} />
      <div style="margin-top:14px">
        {GAMES.map((g) => (
          <button key={g.id} class="srow" onClick={() => go(`/straight/${g.id}`)}>
            <span class="ring">{LETTER[g.id]}</span>
            <span class="atext"><b>{t(shortName(g))}</b><small>{t(g.region)} · {t('Next draw')}: {fmtShort(nextDrawISO(g, drawsOf(data.results, g.id)))}</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StraightChart({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId);
  const iso = nextDrawISO(g, draws);
  const { top7, cols } = straightChart(draws, `${gameId}${iso}`);
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('Straight Predictions')} />
      <div class="pd-sheet">
        <div class="pd-brandtop"><Logo size={28} /><span>Q Spot <em>4D</em> {t('Straight')}</span></div>
        <div class="pd-band date">{fmtShort(iso)}</div>
        <div class="pd-band title">{g.name.toUpperCase()}</div>
        <div class="st-wrap">
          <div class="st-chart">
            {['A', 'B', 'C', 'D'].map((l) => <div key={l} class="st-h">{l}</div>)}
            {[0, 1, 2, 3].map((row) => cols.map((c, ci) => <div key={`${row}${ci}`} class="st-c">{c[row]}</div>))}
          </div>
        </div>
        <div class="meta" style="text-align:center;font-size:12.5px;padding:0 12px 14px">{t('Top 7 digits')}: <b style="letter-spacing:3px">{top7.join(' ')}</b></div>
      </div>
      <div class="meta" style="text-align:center;font-size:12px;line-height:1.5;margin:8px 8px 0">{t('Straight chart uses the top 7 digits of the history analysis. Guesses only, not guaranteed.')}</div>
    </div>
  );
}
