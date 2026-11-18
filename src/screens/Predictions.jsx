import { gameById, fmtShort, todayISO } from '../data/games.js';
import { IconBack, IconMenu, IconBell } from '../icons.jsx';
import { NumberGrid, Loading } from '../ui.jsx';
import { go } from '../App.jsx';

const TILES = [
  { id: 'magnum', label: 'Magnum' },
  { id: 'toto', label: 'Toto' },
  { id: 'damacai', label: 'Da Ma Cai' },
  { id: 'singapore', label: 'Singapore Pools' },
  { id: 'gdlotto', label: 'GD Lotto' },
  { id: 'winnings', label: 'Winnings' },
];

function Tile({ t }) {
  const to = t.id === 'winnings' ? '/winnings' : `/prediction/${t.id}`;
  return (
    <button class="img-tile" aria-label={t.label} onClick={() => go(to)}>
      <img src={`./img/${t.id}.jpg`} alt="" width="256" height="256" />
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
  if (data.status === 'loading' && !data.predictions) return <Loading />;

  return (
    <div class="center-screen">
      <div class="app-bar">
        <button class="icon-btn" aria-label="Menu" onClick={() => toast('Menu is coming soon')}><IconMenu /></button>
        <div><div class="app-title">Quadora</div><div class="tagline">4D Predictions · Results · Analysis</div></div>
        <button class="icon-btn" aria-label="Notifications" onClick={() => toast('Notifications are coming soon')}><IconBell /></button>
      </div>
      {data.demo && <div class="banner">DEMO DATA: sample numbers, not real predictions.</div>}

      <div class="date-above"><span class="date-chip">{fmtShort(todayISO())}</span></div>
      <div class="panel centered">
        <div class="tiles">
          {TILES.map((t) => <Tile key={t.id} t={t} />)}
        </div>
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
