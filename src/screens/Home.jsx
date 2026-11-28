import { useState, useEffect } from 'preact/hooks';
import { C, watchLive } from '../data/cloud.js';
import { GAMES, gameById, fmtDate, nextDrawLabel, todayISO } from '../data/games.js';
import { latestOf } from '../data/store.js';
import { IconChevron, IconBars, IconClock, IconLock } from '../icons.jsx';
import { Top3, NumberGrid, Loading, AppBar, Hero, Panel, SourceCredit } from '../ui.jsx';
import { go } from '../App.jsx';
import { AnalysisCards } from './Analysis.jsx';
import { AdBanner } from '../ads.jsx';
import { t } from '../i18n.js';

const MY = GAMES.filter((g) => g.region === 'Malaysia');
const REGIONS = [['my', 'Malaysia'], ['sg', 'Singapore'], ['kh', 'Cambodia']];

export function ResultBody({ g, draw, onHistory }) {
  return (
    <Panel>
      <div class="rhead">
        {onHistory && <button class="step back-step" aria-label={t('Older results')} onClick={onHistory}><IconChevron /></button>}
        <div>
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:17px">{fmtDate(draw.date)}</div>
          <div class="meta">{t(g.region)}{draw.drawNo ? ` · ${t('Draw #{n}', { n: draw.drawNo })}` : ''}</div>
        </div>
      </div>
      <Top3 draw={draw} />
      {draw.special && draw.special.length > 0 && (<div><div class="label">{t(g.special)}</div><NumberGrid numbers={draw.special} /></div>)}
      {draw.consolation && draw.consolation.length > 0 && (<div><div class="label">{t('Consolation')}</div><NumberGrid numbers={draw.consolation} /></div>)}
    </Panel>
  );
}

// numbers of today's draw shown as they come in (no win check until the full official result is in)
export function liveFor(gameId, draw) {
  const l = C.live && C.live.games && C.live.games[gameId];
  if (!l || !l.date || (draw && draw.date >= l.date)) return null;
  if (Date.now() - (C.live.at || 0) > 3 * 3600e3) return null;
  return l;
}
function LiveCard({ g, l }) {
  const pad = (a) => [...(a || []), ...Array(10).fill('')].slice(0, 10);
  return (
    <Panel>
      <div class="live-head">
        <span class="live-dot" /><b>{t('LIVE')}</b>
        <span class="meta" style="margin-left:6px">{fmtDate(l.date)}</span>
        <span class="live-n">{l.done ? t('All numbers out') : t('{n} of 23 numbers', { n: l.n })}</span>
      </div>
      <div class="live-bar"><i style={`width:${Math.round((l.n / 23) * 100)}%`} /></div>
      <Top3 draw={{ first: l.first || '----', second: l.second || '----', third: l.third || '----' }} />
      <div class="label">{t(g.special)}</div><NumberGrid numbers={pad(l.special)} />
      <div class="label">{t('Consolation')}</div><NumberGrid numbers={pad(l.consolation)} />
      <div class="meta" style="font-size:12px;margin-top:8px;line-height:1.5">{t('Live numbers appear as the draw runs. Wins are checked only after the full official result is in.')}</div>
    </Panel>
  );
}

export function Home({ data, user }) {
  useEffect(() => watchLive(), []);
  const [game, setGame] = useState('magnum');
  if (data.status === 'loading' && !data.results) return <Loading />;
  const g = gameById(game);
  const draw = latestOf(data.results, g.id);
  const region = g.region === 'Malaysia' ? 'my' : g.region === 'Singapore' ? 'sg' : 'kh';
  const fresh = draw && draw.date === todayISO();
  const live = liveFor(g.id, draw);
  const liveAny = (id) => !!liveFor(id, latestOf(data.results, id));
  const pick = (r) => setGame(r === 'my' ? 'magnum' : r === 'sg' ? 'singapore' : 'gdlotto');

  return (
    <div>
      <AppBar title={t('Results')} tagline={t('Latest draw results')} go={go} />
      <div data-game={g.id}><Hero kicker={t(g.region)} title={g.name} pill={live ? `🔴 ${t('LIVE')}` : fresh ? t('NEW') : t('Next {d}', { d: nextDrawLabel(g) })} /></div>

      <div class="tabs" role="tablist">
        {REGIONS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={region === k} class={region === k ? 'tab on' : 'tab'} onClick={() => pick(k)}>{t(l)}{GAMES.some((x) => (k === 'my' ? x.region === 'Malaysia' : k === 'sg' ? x.region === 'Singapore' : x.region === 'Cambodia') && liveAny(x.id)) && <i class="live-dot sm" />}</button>
        ))}
      </div>
      {region === 'my' && (
        <div class="subtabs">
          {MY.map((m) => <button key={m.id} class={game === m.id ? 'chip-btn on' : 'chip-btn'} onClick={() => setGame(m.id)}>{m.name.replace(' 1+3D', '').replace(' 4D', '').replace('Sports ', '')}{liveAny(m.id) && <i class="live-dot sm" />}</button>)}
        </div>
      )}

      <div data-game={g.id} key={g.id} class="swap">
      {live && <LiveCard g={g} l={live} />}
      {!draw && !live && <Panel><div class="empty">{t('Results will appear here after the next draw.')}</div></Panel>}
      {draw && <ResultBody g={g} draw={draw} onHistory={user ? () => go(`/game/${g.id}`) : () => go('/locked')} />}
      {draw && (g.id === 'singapore' ? <SourceCredit name="Singapore Pools" site="singaporepools.com.sg" /> : <AdBanner />)}
      {draw && <AnalysisCards g={g} draw={draw} latest={draw} user={user} />}
      </div>
    </div>
  );
}
