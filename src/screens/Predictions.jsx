import { useState } from 'preact/hooks';
import { gameById, fmtShort, todayISO, nextDrawLabel } from '../data/games.js';
import { NumberGrid, Loading, AppBar, BackBar, Hero, Panel } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { IconDice, IconChevron } from '../icons.jsx';
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
    <button class="gcard" onClick={() => go(to)}>
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
      <AppBar title="Q Spot 4D" tagline={t('4D Predictions · Results · Analysis')} go={go} />

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

      {filter === 'all' && <button class="lucky-card" onClick={() => go('/lucky')}>
        <span class="aicon"><IconDice /></span>
        <span class="atext"><b>{t('Lucky Game Number')}</b><small>{t('Play a quick game, your score is your number')}</small></span>
        <span class="chev"><IconChevron /></span>
      </button>}
    </div>
  );
}

function Dots({ set }) {
  return <span class="dots">{set.join('')}</span>;
}

function PredBody({ p, copy, g, label }) {
  const nums = p.numbers || [];
  return (
    <div class="pd-sheet">
      <div class="pd-band date">{label}</div>
      <div class="pd-band title">{g.name.toUpperCase()}</div>
      {p.important3 && p.important3.length > 0 && (
        <div class="pd-imp">
          <div class="pd-imp-h">{t('Important 3 digit')}</div>
          <div class="pd-imp-row">
            {p.important3.slice(0, 2).map((set, i) => <button key={i} class="pd-imp-n" onClick={() => copy(set.join(''))}>•••{set.join('')}•••</button>)}
          </div>
        </div>
      )}
      {p.chart && p.chart.length > 0 && <div class="pd-chart">{p.chart.map((d, i) => <div key={i}>{d}</div>)}</div>}
      {nums.length > 0 && <div class="pd-nums">{nums.map((n, i) => <button key={i} onClick={() => copy(n)}>{n}</button>)}</div>}
      {p.top3 && p.top3.length > 0 && (
        <div class="pd-top">
          <div class="pd-top-h">{t('Top 3 prediction')}</div>
          <div class="pd-top-row">{p.top3.map((n, i) => <button key={i} onClick={() => copy(n)}>{n}</button>)}</div>
        </div>
      )}
    </div>
  );
}

function PredHistory({ rows, data, gid, copy, g }) {
  const [open, setOpen] = useState(null);
  const draws = drawsOf(data.results, gid);
  const list = rows.slice().sort((a, b) => (a.forDate < b.forDate ? 1 : -1)).slice(0, 30);
  return (
    <div>
      <div class="section-title"><h2>{t('History Predictions')}</h2><span>{t('Last {n} draws', { n: list.length })}</span></div>
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
                {wins.length > 0 && <div class="ph-wins">{wins.map((w, i) => <span key={i}>🎉 {w.number} · {t(w.prize)}</span>)}</div>}
                <PredBody p={p} copy={copy} g={g} label={fmtShort(p.forDate)} />
              </div>
            )}
          </div>
        );
      })}
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
      {rows.length > 0 && <PredHistory rows={rows} data={data} gid={gameId} copy={copy} g={g} />}
    </div>
  );
}

export function Winnings({ data }) {
  const wins = allWins(data);
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
              <div key={i} class="hit" data-game={g.id}>
                <span class="n">{w.number}</span>
                <span style="flex:1"><span style="display:block;font-weight:700;font-size:14px">{g.name}</span><span class="meta">{fmtShort(w.date)} · {w.date.slice(0, 4)}</span></span>
                <span class="pill gold">{w.prize === 'Special' ? t(g.special) : t(w.prize)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
