import { GAMES, fmtShort } from '../data/games.js';
import { Logo } from '../icons.jsx';
import { NumberGrid, Loading } from '../ui.jsx';

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

export function Predictions({ data }) {
  if (data.status === 'loading' && !data.predictions) return <Loading />;
  const games = (data.predictions && data.predictions.games) || {};
  const any = GAMES.some((g) => games[g.id]);

  return (
    <div>
      <div class="topbar">
        <div>
          <div class="title">Predictions</div>
          <div class="sub">Statistical picks for the next draw</div>
        </div>
      </div>

      {data.demo && <div class="banner">DEMO DATA: sample numbers, not real predictions.</div>}
      <div class="note" style="margin-bottom:14px">
        Predictions are statistical guesses made for entertainment. They are not guaranteed and not betting advice.
      </div>

      {!any && (
        <div class="card"><div class="empty">Today's predictions will appear here after the daily update.</div></div>
      )}

      {GAMES.map((g) => {
        const p = games[g.id];
        if (!p) return null;
        return (
          <div key={g.id} class="card" style="cursor:default">
            <div class="card-head">
              <div>
                <div class="game">{g.name}</div>
                <div class="meta">For draw {p.forDate ? fmtShort(p.forDate) : 'next'}</div>
              </div>
              <span class="spacer" />
              <Logo size={26} />
            </div>

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
        );
      })}
    </div>
  );
}
