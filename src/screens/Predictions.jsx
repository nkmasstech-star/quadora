import { useState } from 'preact/hooks';
import { gameById, fmtShort, todayISO, nextDrawLabel } from '../data/games.js';
import { NumberGrid, Loading, AppBar, BackBar, Hero, Panel, Sheet } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { IconClock } from '../icons.jsx';
import { IconDice, IconChevron, IconVote, Logo } from '../icons.jsx';
import { goWithAd } from '../ads.jsx';
import { drawsOf, checkPrediction, allWins } from '../data/store.js';

const CARDS = [
  { id: 'magnum', label: 'Magnum', region: 'my', letter: 'M' },
  { id: 'toto', label: 'Toto', region: 'my', letter: 'T' },
  { id: 'damacai', label: 'Da Ma Cai', region: 'my', letter: 'D' },
  { id: 'singapore', label: 'Singapore', region: 'sg', letter: 'S' },
  { id: 'gdlotto', label: 'GD Lotto', region: 'kh', letter: 'G' },
  { id: 'winnings', label: 'Winnings', region: 'all', letter: 'W' },
];
const REGION_NAME = { my: 'Malaysia', sg: 'Singapore', kh: 'Cambodia', all: 'History' };
const FILTERS = [['all', 'All'], ['my', 'Malaysia'], ['sg', 'Singapore'], ['kh', 'Cambodia']];

function GameCard({ c, ready }) {
  const to = c.id === 'winnings' ? '/winnings' : `/prediction/${c.id}`;
  const g = c.id === 'winnings' ? null : gameById(c.id);
  const when = g ? nextDrawLabel(g) : t('Past wins');
  return (
    <button class="gcard" onClick={() => goWithAd(to, c.id)}>
      <div class="gcard-top">
        <span class="ring">{c.letter}</span>
        {c.id !== 'winnings' && <span class={ready ? 'badge ready' : 'badge'}>{ready ? t('Ready') : t('Soon')}</span>}
      </div>
      <div class="gcard-name">{t(c.label)}</div>
      <div class="gcard-sub">{t(REGION_NAME[c.region])} · {when}</div>
    </button>
  );
}

function Digits({ digits }) {
  const counts = {};
  digits.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  return <span class="imp-num">{digits.map((d, i) => <i key={i} class={counts[d] > 1 ? 'dbl' : ''}>{d}</i>)}</span>;
}

export function Predictions({ data, toast }) {
  const [filter, setFilter] = useState('all');
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const games = (data.predictions && data.predictions.games) || {};
  const ready = Object.keys(games).length;
  const list = CARDS.filter((c) => filter === 'all' || c.region === filter);

  return (
    <div>
      <AppBar title="Q Spot 4D" tagline={t('4D Analysis · Predictions · Results')} go={go} />

      <div class="hero">
        <div class="hero-text">
          <div class="hero-kicker">{fmtShort(todayISO())}</div>
          <div class="hero-title">{t("Today's predictions")}</div>
        </div>
        <span class="hero-pill">{ready ? t('{n} ready', { n: ready }) : t('Updates daily')}</span>
      </div>

      <div class="tabs" role="tablist">
        {FILTERS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} class={filter === k ? 'tab on' : 'tab'} onClick={() => setFilter(k)}>{t(l)}</button>
        ))}
      </div>

      <div class="gcards">
        {list.map((c) => <GameCard key={c.id} c={c} ready={!!games[c.id]} />)}
      </div>

      {filter === 'all' && (
        <div class="cardrow">
          <button class="lucky-card" onClick={() => go('/lucky')}>
            <span class="aicon"><IconDice /></span>
            <span class="atext"><b>{t('Lucky Game Number')}</b></span>
            <span class="chev"><IconChevron /></span>
          </button>
          <button class="lucky-card" onClick={() => go('/poll')}>
            <span class="aicon"><IconVote /></span>
            <span class="atext"><b>{t('Voting Poll')}</b></span>
            <span class="chev"><IconChevron /></span>
          </button>
        </div>
      )}
    </div>
  );
}

const sortD = (n) => String(n).split('').sort().join('');
const isBig = (d) => Number(d) >= 5;
const shortName = (g) => (g.id === 'gdlotto' ? 'GD Lotto' : g.name);
// does the 4-digit number contain all digits of a 3-digit set?
function contains(num, set) {
  const pool = String(num).split('');
  for (const d of set.map(String)) { const i = pool.indexOf(d); if (i < 0) return false; pool.splice(i, 1); }
  return pool;
}
const WIN_COLORS = ['#FF5A5F', '#2BB3FF', '#8B5CF6', '#22C55E', '#F97316', '#E11D8A'];
const winColor = (i) => WIN_COLORS[i % WIN_COLORS.length];

function ChartCard({ p, g }) {
  return (
    <div class="pd-chart-wrap">
      <div class="pd-chart-title">{shortName(g)} {t('Chart')}</div>
      <div class="pd-chart">
        {p.chart.map((d, i) => <div key={i}>{d}</div>)}
      </div>
    </div>
  );
}

function PredBody({ p, copy, g, label, wins = [] }) {
  const nums = p.numbers || [];
  const colorOf = {};
  wins.forEach((w, i) => { if (!colorOf[`${w.kind}${w.number}`]) colorOf[`${w.kind}${w.number}`] = winColor(i); });
  const wonN = new Set(wins.filter((w) => w.kind === '4D').map((w) => w.number));
  const wonT = new Set(wins.filter((w) => w.kind === 'Top3').map((w) => w.number));
  const impIdx = (set) => wins.findIndex((w) => w.kind === '4D' && contains(w.number, set));
  const impWon = (set) => impIdx(set) >= 0;
  return (
    <div class="pd-sheet">
      <div class="pd-band date">{label}</div>
      <div class="pd-band title">{g.name.toUpperCase()}</div>
      {p.important3 && p.important3.length > 0 && (
        <div class="pd-imp">
          <div class="pd-imp-h">{t('Important 3 digit')}</div>
          <div class="pd-imp-row">
            {p.important3.slice(0, 2).map((set, i) => <button key={i} class={impWon(set) ? 'pd-imp-n ring' : 'pd-imp-n'} style={impWon(set) ? `--rc:${winColor(impIdx(set))}` : undefined} onClick={() => copy(set.join(''))}>•••{set.join('')}•••</button>)}
          </div>
        </div>
      )}
      {p.chart && p.chart.length > 0 && <div class="pd-chart-bg"><ChartCard p={p} g={g} /></div>}
      {nums.length > 0 && <div class="pd-nums">{nums.map((n, i) => <button key={i} class={wonN.has(n) ? 'ring' : ''} style={wonN.has(n) ? `--rc:${colorOf['4D' + n]}` : undefined} onClick={() => copy(n)}><span>{n}</span></button>)}</div>}
      {p.top3 && p.top3.length > 0 && (
        <div class="pd-top">
          <div class="pd-top-h">{t('Top 3 prediction')}</div>
          <div class="pd-top-row">{p.top3.map((n, i) => <button key={i} class={wonT.has(n) ? 'ring' : ''} style={wonT.has(n) ? `--rc:${colorOf['Top3' + n]}` : undefined} onClick={() => copy(n)}><span>{n}</span></button>)}</div>
        </div>
      )}
      <div class="pd-brand"><Logo size={20} />Q Spot 4D</div>
    </div>
  );
}

function WinDetails({ wins }) {
  if (!wins.length) return null;
  return (
    <div class="pd-win-box">
      <div class="pd-win-h">🎉 {wins.length === 1 ? t('1 number won') : t('{n} numbers won', { n: wins.length })}</div>
      {wins.map((w, i) => (
        <div key={i} class="pd-win-row" style={`--rc:${winColor(i)}`}>
          <i class="wdot" style={`background:${winColor(i)}`} />
          <b class="wnum">{w.number}</b><span class="pill gold">{t(w.prize)}</span>
        </div>
      ))}
    </div>
  );
}

function PredHistory({ rows, data, gid, copy, g }) {
  const draws = drawsOf(data.results, gid);
  const list = rows.slice().sort((a, b) => (a.forDate < b.forDate ? 1 : -1)).slice(0, 30);
  const [open, setOpen] = useState(() => (import.meta.env.DEV && location.search.includes('openph') ? (list.find((p) => checkPrediction(p, draws.find((d) => d.date === p.forDate)).length) || {}).forDate : null));
  return (
    <div>
      {list.map((p) => {
        const wins = checkPrediction(p, draws.find((d) => d.date === p.forDate));
        const on = open === p.forDate;
        return (
          <div key={p.forDate} class="ph">
            <button class="ph-row" onClick={() => setOpen(on ? null : p.forDate)}>
              <span class="ph-d">{fmtShort(p.forDate)} <i>{p.forDate.slice(0, 4)}</i></span>
              {wins.length > 0 && <span class="pill gold">{t('Win')} {wins.length}</span>}
              <span class="chev" style={on ? 'transform:rotate(90deg)' : ''}><IconChevron /></span>
            </button>
            {on && (
              <div>
                <WinDetails wins={wins} />
                <PredBody p={p} copy={copy} g={g} label={fmtShort(p.forDate)} wins={wins} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PredHistoryPage({ data, gameId, toast }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const rows = (data.predHistory && data.predHistory.games && data.predHistory.games[gameId]) || [];
  const copy = async (n) => { try { await navigator.clipboard.writeText(n); toast(t('Copied {n}', { n })); } catch (e) { /* ignore */ } };
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('History Predictions')} />
      <Hero kicker={t(g.region)} title={g.name} pill={t('Last {n} draws', { n: Math.min(30, rows.length) })} />
      {rows.length === 0 ? <Panel><div class="empty">{t('No history yet.')}</div></Panel> : <div style="margin-top:10px"><PredHistory rows={rows} data={data} gid={gameId} copy={copy} g={g} /></div>}
    </div>
  );
}

export function PredictionDetail({ data, gameId, toast }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const p = ((data.predictions && data.predictions.games) || {})[gameId];
  const rows = (data.predHistory && data.predHistory.games && data.predHistory.games[gameId]) || [];
  const copy = async (n) => { try { await navigator.clipboard.writeText(n); toast(t('Copied {n}', { n })); } catch (e) { /* ignore */ } };

  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('Prediction')} />
      {!p && <Panel><div class="empty">{t('Prediction for this game will appear after the daily update.')}</div></Panel>}
      {p && <PredBody p={p} copy={copy} g={g} label={p.forDate ? fmtShort(p.forDate) : t('Next draw')} />}
      {p && <div class="meta" style="text-align:center;font-size:12px;line-height:1.5;margin:8px 8px 0">{t('Tap a number to copy it. Predictions are guesses, not guaranteed. For fun only. 18+')}</div>}
      {rows.length > 0 && (
        <div class="acards" style="margin-top:14px">
          <button class="acard" onClick={() => go(`/predhist/${g.id}`)}>
            <span class="aicon"><IconClock /></span>
            <span class="atext"><b>{t('History Predictions')}</b><small>{t('Last {n} draws', { n: Math.min(30, rows.length) })}</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Winnings({ data, toast }) {
  const [sel, setSel] = useState(null);
  const wins = allWins(data);
  const copy = async (n) => { try { await navigator.clipboard.writeText(n); toast && toast(t('Copied {n}', { n })); } catch (e) { /* ignore */ } };
  const preview = (w) => {
    const rows = (data.predHistory && data.predHistory.games && data.predHistory.games[w.game]) || [];
    const p = rows.find((r) => r.forDate === w.date);
    if (!p) return null;
    const draw = drawsOf(data.results, w.game).find((d) => d.date === w.date);
    return { p, g: gameById(w.game), wins: checkPrediction(p, draw) };
  };
  const pv = sel ? preview(sel) : null;
  return (
    <div>
      <BackBar title={t('Winnings')} />
      <Hero kicker={t('History')} title={t('Our past wins')} pill={t('{n} wins', { n: wins.length })} />
      {wins.length === 0 && <Panel><div class="empty">{t('Winning predictions will be listed here after each draw.')}</div></Panel>}
      {wins.length > 0 && (
        <div style="margin-top:14px">
          {wins.map((w, i) => {
            const g = gameById(w.game);
            if (!g) return null;
            return (
              <button key={i} class="hit" data-game={g.id} style="width:100%;text-align:left" onClick={() => setSel(w)}>
                <span class="n">{w.number}</span>
                <span style="flex:1"><span style="display:block;font-weight:700;font-size:14px">{g.name}</span><span class="meta">{fmtShort(w.date)} · {w.date.slice(0, 4)}</span></span>
                <span class="pill gold">{w.prize === 'Special' ? t(g.special) : t(w.prize)}</span>
              </button>
            );
          })}
        </div>
      )}
      {pv && (
        <Sheet title={`${pv.g.name} · ${fmtShort(sel.date)}`} onClose={() => setSel(null)}>
          <div data-game={pv.g.id}>
            <WinDetails wins={pv.wins} />
            <PredBody p={pv.p} copy={copy} g={pv.g} label={fmtShort(sel.date)} wins={pv.wins} />
          </div>
        </Sheet>
      )}
    </div>
  );
}
