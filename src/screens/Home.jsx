import { useState } from 'preact/hooks';
import { GAMES, gameById, fmtDate, nextDrawLabel } from '../data/games.js';
import { latestOf } from '../data/store.js';
import { Logo, IconChevron } from '../icons.jsx';
import { Top3, NumberGrid, Loading } from '../ui.jsx';
import { go } from '../App.jsx';

const MY = GAMES.filter((g) => g.region === 'Malaysia');

export function Home({ data }) {
  const [game, setGame] = useState('magnum');
  const [open, setOpen] = useState(import.meta.env.DEV && location.search.includes('open'));
  if (data.status === 'loading' && !data.results) return <Loading />;

  const g = gameById(game);
  const draw = latestOf(data.results, g.id);
  const region = g.region === 'Malaysia' ? 'my' : g.region === 'Singapore' ? 'sg' : 'gd';

  const pickRegion = (r) => {
    if (r === 'my') { setOpen(!open); if (region !== 'my') setGame('magnum'); return; }
    setOpen(false);
    setGame(r === 'sg' ? 'singapore' : 'gdlotto');
  };

  return (
    <div>
      <div class="topbar">
        <div class="brand">
          <Logo size={36} />
          <span class="brand-name">Quadora</span>
        </div>
      </div>

      {data.demo && <div class="banner">DEMO DATA: sample numbers for design preview only, not real results.</div>}

      <div class="regions">
        <button class={region === 'my' ? 'region on' : 'region'} aria-expanded={open} onClick={() => pickRegion('my')}>
          Malaysia <span style={open ? 'transform:rotate(-90deg);display:inline-flex' : 'transform:rotate(90deg);display:inline-flex'}><IconChevron /></span>
        </button>
        <button class={region === 'sg' ? 'region on' : 'region'} onClick={() => pickRegion('sg')}>Singapore</button>
        <button class={region === 'gd' ? 'region on' : 'region'} onClick={() => pickRegion('gd')}>GD Lotto</button>
      </div>

      {open && (
        <div class="dropdown">
          {MY.map((m) => (
            <button key={m.id} class={game === m.id ? 'on' : ''} onClick={() => { setGame(m.id); setOpen(false); }}>
              {m.name}
              {game === m.id && <span>✓</span>}
            </button>
          ))}
        </div>
      )}

      <div class="section-title">
        <h2>{g.name}</h2>
        <span>Next draw: {nextDrawLabel(g)}</span>
      </div>

      {!draw && (
        <div class="card" style="cursor:default">
          <div class="empty">Results will appear here after the next draw.</div>
        </div>
      )}

      {draw && (
        <div class="card" style="cursor:default">
          <div class="card-head">
            <div>
              <div style="font-weight:600">{fmtDate(draw.date)}</div>
              <div class="meta">{g.region}{draw.drawNo ? ` · Draw #${draw.drawNo}` : ''}</div>
            </div>
            <span class="spacer" />
            <button class="step" aria-label="Previous results history" onClick={() => go(`/game/${g.id}`)}><IconChevron /></button>
          </div>
          <Top3 draw={draw} />
          {draw.special && draw.special.length > 0 && (
            <div>
              <div class="label">Special</div>
              <NumberGrid numbers={draw.special} />
            </div>
          )}
          {draw.consolation && draw.consolation.length > 0 && (
            <div>
              <div class="label">Consolation</div>
              <NumberGrid numbers={draw.consolation} />
            </div>
          )}
          <div class="meta" style="margin-top:12px;text-align:center">Tap the arrow for older draws</div>
        </div>
      )}

      <div class="note" style="margin-top:6px">
        Results are shown for information only. Always confirm with the official operator before acting on any number.
      </div>
    </div>
  );
}
