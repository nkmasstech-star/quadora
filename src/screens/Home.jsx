import { useState } from 'preact/hooks';
import { GAMES, gameById, fmtDate, nextDrawLabel, todayISO } from '../data/games.js';
import { latestOf } from '../data/store.js';
import { IconChevron, IconBars, IconClock } from '../icons.jsx';
import { Top3, NumberGrid, Loading, AppBar, Hero, Panel } from '../ui.jsx';
import { go } from '../App.jsx';

const MY = GAMES.filter((g) => g.region === 'Malaysia');
const REGIONS = [['my', 'Malaysia'], ['sg', 'Singapore'], ['kh', 'Cambodia']];

export function ResultBody({ g, draw, onHistory }) {
  return (
    <Panel>
      <div class="rhead">
        {onHistory && <button class="step back-step" aria-label="Older results" onClick={onHistory}><IconChevron /></button>}
        <div>
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:17px">{fmtDate(draw.date)}</div>
          <div class="meta">{g.region}{draw.drawNo ? ` · Draw #${draw.drawNo}` : ''}</div>
        </div>
      </div>
      <Top3 draw={draw} />
      {draw.special && draw.special.length > 0 && (<div><div class="label">Special</div><NumberGrid numbers={draw.special} /></div>)}
      {draw.consolation && draw.consolation.length > 0 && (<div><div class="label">Consolation</div><NumberGrid numbers={draw.consolation} /></div>)}
    </Panel>
  );
}

export function Home({ data }) {
  const [game, setGame] = useState('magnum');
  if (data.status === 'loading' && !data.results) return <Loading />;
  const g = gameById(game);
  const draw = latestOf(data.results, g.id);
  const region = g.region === 'Malaysia' ? 'my' : g.region === 'Singapore' ? 'sg' : 'kh';
  const fresh = draw && draw.date === todayISO();
  const pick = (r) => setGame(r === 'my' ? 'magnum' : r === 'sg' ? 'singapore' : 'gdlotto');

  return (
    <div>
      <AppBar title="Results" tagline="Latest draw results" go={go} />
      <Hero kicker={g.region} title={g.name} pill={fresh ? 'NEW' : `Next ${nextDrawLabel(g)}`} />

      <div class="tabs" role="tablist">
        {REGIONS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={region === k} class={region === k ? 'tab on' : 'tab'} onClick={() => pick(k)}>{l}</button>
        ))}
      </div>
      {region === 'my' && (
        <div class="subtabs">
          {MY.map((m) => <button key={m.id} class={game === m.id ? 'chip-btn on' : 'chip-btn'} onClick={() => setGame(m.id)}>{m.name.replace(' 1+3D', '').replace(' 4D', '').replace('Sports ', '')}</button>)}
        </div>
      )}

      {!draw && <Panel><div class="empty">Results will appear here after the next draw.</div></Panel>}
      {draw && <ResultBody g={g} draw={draw} onHistory={() => go(`/game/${g.id}`)} />}
      {draw && (
        <div class="acards">
          <button class="acard" onClick={() => go(`/analysis/today/${g.id}`)}>
            <span class="aicon"><IconBars /></span>
            <span class="atext"><b>Today's result analysis</b><small>Doubles, hot digits, formats and more</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
          <button class="acard" onClick={() => go(`/analysis/history/${g.id}`)}>
            <span class="aicon"><IconClock /></span>
            <span class="atext"><b>History analysis</b><small>Patterns across all stored draws</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
        </div>
      )}
    </div>
  );
}
