import { useState } from 'preact/hooks';
import { gameById, fmtShort, todayISO, nextDrawLabel } from '../data/games.js';
import { IconBack, IconMenu, IconBell } from '../icons.jsx';
import { NumberGrid, Loading } from '../ui.jsx';
import { go } from '../App.jsx';

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
  const when = g ? nextDrawLabel(g) : 'Past wins';
  return (
    <button class="gcard" onClick={() => go(to)}>
      <div class="gcard-top">
        <span class="ring">{c.letter}</span>
        {c.id !== 'winnings' && <span class={ready ? 'badge ready' : 'badge'}>{ready ? 'Ready' : 'Soon'}</span>}
      </div>
      <div class="gcard-name">{c.label}</div>
      <div class="gcard-sub">{REGION_NAME[c.region]} · {when}</div>
    </button>
  );
}

function Balls({ digits }) {
  const counts = {};
  digits.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  return (
    <div class="balls">
      {digits.map((d, i) => (
        <span key={i} class={counts[d] > 1 ? 'ball dbl' : 'ball'}>{d}</span>
      ))}
    </div>
  );
}

export function Predictions({ data, toast }) {
  const [filter, setFilter] = useState('all');
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const games = (data.predictions && data.predictions.games) || {};
  const ready = Object.keys(games).length;
  const list = CARDS.filter((c) => filter === 'all' || c.region === filter);

  return (
    <div>
      <div class="app-bar">
        <button class="icon-btn" aria-label="Menu" onClick={() => toast('Menu is coming soon')}><IconMenu /></button>
        <div>
          <div class="app-title">Quadora</div>
          <div class="tagline">4D Predictions · Results · Analysis</div>
        </div>
        <button class="icon-btn bell" aria-label="Notifications" onClick={() => toast('Notifications are coming soon')}><IconBell /><i class="dot" /></button>
      </div>

      <div class="hero">
        <div class="hero-text">
          <div class="hero-kicker">{fmtShort(todayISO())}</div>
          <div class="hero-title">Today's predictions</div>
        </div>
        <span class="hero-pill">{ready ? `${ready} ready` : 'Updates daily'}</span>
      </div>

      <div class="tabs" role="tablist">
        {FILTERS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} class={filter === k ? 'tab on' : 'tab'} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div class="gcards">
        {list.map((c) => <GameCard key={c.id} c={c} ready={!!games[c.id]} />)}
      </div>
    </div>
  );
}

export function PredictionDetail({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">Game not found.</div>;
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const p = ((data.predictions && data.predictions.games) || {})[gameId];

  return (
    <div>
      <div class="topbar">
        <button class="back" aria-label="Back" onClick={() => history.back()}><IconBack /></button>
        <div>
          <div class="title">{g.name}</div>
          <div class="sub">{p ? `Prediction for ${p.forDate ? fmtShort(p.forDate) : 'next draw'}` : g.region}</div>
        </div>
      </div>

      {data.demo && <div class="banner">DEMO DATA: sample numbers, not real predictions.</div>}

      {!p && <div class="card" style="cursor:default"><div class="empty">Prediction for this game will appear after the daily update.</div></div>}

      {p && (
        <div class="card" style="cursor:default">
          {p.important3 && p.important3.length > 0 && (
            <div>
              <div class="label" style="margin-top:0">Important 3 digit</div>
              {p.important3.map((set, i) => (
                <div key={i} class="pred-row"><Balls digits={set} /></div>
              ))}
            </div>
          )}
          {p.numbers && p.numbers.length > 0 && (
            <div>
              <div class="label">4D numbers</div>
              <NumberGrid numbers={p.numbers} />
            </div>
          )}
          {p.top3 && p.top3.length > 0 && (
            <div>
              <div class="label">Top 3 picks</div>
              <div class="nums" style="grid-template-columns:repeat(2,1fr)">
                {p.top3.map((n, i) => <div key={i} class="chip" style="font-size:18px;padding:9px 0;border-color:var(--gold)">{n}</div>)}
              </div>
            </div>
          )}
          {p.chart && p.chart.length > 0 && (
            <div>
              <div class="label">Chart</div>
              <div class="chart">
                {p.chart.map((d, i) => <div key={i} class="cell">{d}</div>)}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export function Winnings() {
  return (
    <div>
      <div class="topbar">
        <button class="back" aria-label="Back" onClick={() => history.back()}><IconBack /></button>
        <div class="title">Winnings</div>
      </div>
      <div class="card" style="cursor:default"><div class="empty">Winning records will appear here.</div></div>
    </div>
  );
}
