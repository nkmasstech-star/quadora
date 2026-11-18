import { GAMES, fmtDate, fmtShort, nextDraw, nextDrawLabel } from '../data/games.js';
import { latestOf } from '../data/store.js';
import { Logo, IconChevron, IconCalendar } from '../icons.jsx';
import { Top3, Loading } from '../ui.jsx';
import { go } from '../App.jsx';

export function Home({ data }) {
  if (data.status === 'loading' && !data.results) return <Loading />;
  const anyData = GAMES.some((g) => latestOf(data.results, g.id));

  return (
    <div>
      <div class="topbar">
        <div class="brand">
          <Logo size={36} />
          <span class="brand-name">Quadora</span>
        </div>
      </div>

      {data.demo && <div class="banner">DEMO DATA: sample numbers for design preview only, not real results.</div>}

      <div class="section-title" style="margin-top:4px">
        <h2>Next draws</h2>
        <span>Wed · Sat · Sun, GD Lotto daily</span>
      </div>
      <div class="filters" role="list">
        {GAMES.map((g) => (
          <div key={g.id} role="listitem" class="pill gold" style="padding:8px 12px;flex:none">
            <IconCalendar />
            <span style="color:var(--text);font-weight:600">{g.name.replace(' 4D', '').replace(' 1+3D', '')}</span>
            <span>{nextDrawLabel(g)}</span>
          </div>
        ))}
      </div>

      <div class="section-title">
        <h2>Latest results</h2>
        <span>{data.results && data.results.updated ? `Updated ${data.results.updated.slice(0, 10)}` : ''}</span>
      </div>

      {!anyData && (
        <div class="card">
          <div class="empty">
            Results will appear here after the next draw.
            <br />
            Pull the latest from Profile, then Refresh data.
          </div>
        </div>
      )}

      {GAMES.map((g) => {
        const draw = latestOf(data.results, g.id);
        if (!draw && anyData) {
          return (
            <button key={g.id} class="card" onClick={() => go(`/game/${g.id}`)}>
              <div class="card-head">
                <div>
                  <div class="game">{g.name}</div>
                  <div class="meta">{g.region} · Next draw {nextDrawLabel(g)}</div>
                </div>
              </div>
              <div class="waiting">Waiting for the first result</div>
            </button>
          );
        }
        if (!draw) return null;
        return (
          <button key={g.id} class="card" onClick={() => go(`/game/${g.id}`)}>
            <div class="card-head">
              <div>
                <div class="game">{g.name}</div>
                <div class="meta">{g.region} · {fmtShort(draw.date)}{draw.drawNo ? ` · #${draw.drawNo}` : ''}</div>
              </div>
              <span class="spacer" />
              <span class="chev"><IconChevron /></span>
            </div>
            <Top3 draw={draw} />
          </button>
        );
      })}

      <div class="note" style="margin-top:6px">
        Results are shown for information only. Always confirm with the official operator before acting on any number.
      </div>
    </div>
  );
}
