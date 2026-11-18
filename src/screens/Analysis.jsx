import { gameById, fmtShort, fmtDate } from '../data/games.js';
import { drawsOf, latestOf } from '../data/store.js';
import { analyze, pct } from '../data/analysis.js';
import { BackBar, Hero, Panel, Loading } from '../ui.jsx';
import { t } from '../i18n.js';

function Bars({ rows, max, accent }) {
  const m = max || Math.max(1, ...rows.map((r) => r.v));
  return (
    <div class="bars">
      {rows.map((r) => (
        <div key={r.k} class="bar-row">
          <span class="bar-k">{r.k}</span>
          <span class="bar-track"><i class={r.hot ? 'hot' : ''} style={`width:${Math.max(3, (r.v / m) * 100)}%`} /></span>
          <span class="bar-v">{r.label !== undefined ? r.label : r.v}</span>
        </div>
      ))}
    </div>
  );
}

function Split({ a, b, la, lb }) {
  return (
    <div>
      <div class="split"><i style={`width:${a}%`} /></div>
      <div class="split-l"><span>{la} {a}%</span><span>{lb} {100 - a}%</span></div>
    </div>
  );
}

function Stat({ v, l }) {
  return (<div class="stat"><div class="stat-v">{v}</div><div class="stat-l">{l}</div></div>);
}

function Chips({ list, fmt }) {
  if (!list || !list.length) return <div class="meta">{t('Nothing yet')}</div>;
  return (<div class="nums" style="grid-template-columns:repeat(3,1fr)">{list.map(([k, c]) => <div key={k} class="chip">{k}<small>{fmt ? fmt(c) : `×${c}`}</small></div>)}</div>);
}

export function Report({ s, history }) {
  const hottest = s.digit.indexOf(Math.max(...s.digit));
  const coldest = s.digit.indexOf(Math.min(...s.digit));
  const total = s.total;
  const digitTotal = total * 4;
  return (
    <div>
      <Panel title={t('At a glance')}>
        <div class="stats">
          <Stat v={total} l={t('Numbers')} />
          <Stat v={`${pct(s.withDouble, total)}%`} l={t('Have a double')} />
          <Stat v={s.avgSum.toFixed(1)} l={t('Avg digit sum')} />
          <Stat v={hottest} l={t('Hottest digit')} />
          <Stat v={coldest} l={t('Coolest digit')} />
          <Stat v={s.commonSum ? s.commonSum[0] : '-'} l={t('Common sum')} />
        </div>
      </Panel>

      <Panel title={t('Digit frequency (0-9)')}>
        <Bars rows={s.digit.map((c, d) => ({ k: d, v: c, hot: d === hottest, label: `${pct(c, digitTotal)}%` }))} />
        <div class="meta" style="margin-top:8px">{t('Hottest {a} · coolest {b}', { a: hottest, b: coldest })}</div>
      </Panel>

      <Panel title={t('Number formats')}>
        <Bars rows={Object.keys(s.types).map((t) => ({ k: t, v: s.types[t], label: `${s.types[t]} · ${pct(s.types[t], total)}%` }))} max={total} />
        <div class="meta" style="margin-top:8px">{t('ABCD all different · AABC one pair · AABB two pairs · AAAB triple · AAAA four same')}</div>
      </Panel>

      <Panel title={t('Double digits')}>
        <div class="stats">
          <Stat v={s.withDouble} l={t('Any repeated digit')} />
          <Stat v={s.adjacentPair} l={t('Side-by-side pair')} />
          <Stat v={s.types.AABB + s.types.AAAB + s.types.AAAA} l={t('Strong repeats')} />
        </div>
      </Panel>

      <Panel title={t('Hot endings (last 2 digits)')}><Chips list={s.topLast2} /></Panel>
      <Panel title={t('Hot starts (first 2 digits)')}><Chips list={s.topFirst2} /></Panel>
      {s.topLast3 && s.topLast3.length > 0 && <Panel title={t('Repeated last 3 digits')}><Chips list={s.topLast3} /></Panel>}

      <Panel title={t('Best digit in each position')}>
        <div class="stats four">
          {['1st place', '2nd place', '3rd place', '4th place'].map((l, i) => {
            const m = Math.max(...s.pos[i]);
            return <Stat key={l} v={s.pos[i].indexOf(m)} l={t(l)} />;
          })}
        </div>
      </Panel>

      <Panel title={t('Number direction')}>
        <Bars rows={Object.entries(s.direction).map(([k, v]) => ({ k: t(k === 'Mixed' ? 'Mix' : k === 'Rising' ? 'Up' : 'Down'), v, label: `${v} · ${pct(v, total)}%` }))} max={total} />
        <div class="meta" style="margin-top:8px">{t('Rising 1234 · Falling 4321 · Mix goes up and down')}</div>
      </Panel>

      <Panel title={t('Odd and even, high and low')}>
        <Split a={pct(s.oddDigits, digitTotal)} b={0} la={t('Odd digits')} lb={t('Even digits')} />
        <div style="height:12px" />
        <Split a={pct(s.lowDigits, digitTotal)} b={0} la={t('Low 0-4')} lb={t('High 5-9')} />
        <div style="height:12px" />
        <Split a={pct(s.oddNumbers, total)} b={0} la={t('Odd numbers')} lb={t('Even numbers')} />
      </Panel>

      <Panel title={t('Digit sum')}>
        <div class="stats">
          <Stat v={s.minSum} l={t('Lowest')} />
          <Stat v={s.avgSum.toFixed(1)} l={t('Average')} />
          <Stat v={s.maxSum} l={t('Highest')} />
        </div>
      </Panel>

      <Panel title={t('Same digits, different order')}>
        {s.boxGroups.length === 0 ? <div class="meta">{history ? t('No such sets found') : t('No such sets in this draw')}</div> : (
          <div class="boxsets">{s.boxGroups.slice(0, 6).map((g, i) => <div key={i} class="boxset">{g.join('  ·  ')}</div>)}</div>
        )}
      </Panel>

      {history ? (
        <div>
          <Panel title={t('Most repeated numbers')}><Chips list={s.hotNumbers} /></Panel>
          <Panel title={t('Not seen for the longest')}>
            {s.overdue && s.overdue.length ? <Chips list={s.overdue} fmt={(i) => t('{n} draws ago', { n: i })} /> : <div class="meta">{t('Needs more draws')}</div>}
          </Panel>
          <Panel title={t('Carried over from the last draw')}>
            <div class="stats"><Stat v={(s.carryAvg || 0).toFixed(1)} l={t('Avg numbers repeated')} /><Stat v={s.drawCount} l={t('Draws studied')} /><Stat v={total} l={t('Numbers studied')} /></div>
          </Panel>
        </div>
      ) : (
        <Panel title={t('Repeated inside this draw')}>
          {s.repeats.length === 0 ? <div class="meta">{t('No number repeated')}</div> : <Chips list={s.repeats} />}
        </Panel>
      )}
    </div>
  );
}

export function AnalysisToday({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draw = latestOf(data.results, gameId);
  return (
    <div>
      <BackBar title={t("Today's analysis")} />
      <Hero kicker={g.name} title={t("Today's result analysis")} pill={draw ? fmtShort(draw.date) : '-'} />
      {!draw ? <Panel><div class="empty">{t('Analysis appears after the latest result is in.')}</div></Panel> : <Report s={analyze([draw])} />}
    </div>
  );
}

export function AnalysisHistory({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId);
  return (
    <div>
      <BackBar title={t('History analysis')} />
      <Hero kicker={g.name} title={t('Patterns over time')} pill={t('{n} draws', { n: draws.length })} />
      {draws.length === 0 ? <Panel><div class="empty">{t('History analysis appears once draws are stored.')}</div></Panel> : <Report s={analyze(draws)} history />}
    </div>
  );
}
