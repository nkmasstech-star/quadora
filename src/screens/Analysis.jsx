import { gameById, fmtShort, fmtDate } from '../data/games.js';
import { drawsOf, latestOf } from '../data/store.js';
import { analyze, pct } from '../data/analysis.js';
import { BackBar, Hero, Panel, Loading } from '../ui.jsx';
import { t } from '../i18n.js';
import { go } from '../App.jsx';
import { IconBars, IconClock, IconChevron, IconLock } from '../icons.jsx';
import { useState } from 'preact/hooks';

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

const TYPE_NAMES = { ABCD: 'All 4 different', AABC: 'One pair', AABB: 'Two pairs', AAAB: 'Triple', AAAA: 'Four same' };

function Versus({ title, a, la, lb, note, hint }) {
  const lead = a === 50 ? t('Balanced') : a > 50 ? la : lb;
  return (
    <div class="versus">
      <div class="vs-title">{title}</div>
      <div class="vs-row"><span><b>{a}%</b> {la}</span><span>{lb} <b>{100 - a}%</b></span></div>
      <div class="split"><i style={`width:${a}%`} /></div>
      <div class="vs-note">{hint}</div>
      <div class="vs-lead">{t('More: {x}', { x: lead })}</div>
    </div>
  );
}

function Patterns({ list, legend }) {
  if (!list || !list.length) return null;
  return (
    <div>
      <div class="nums" style="grid-template-columns:repeat(3,1fr);margin-top:10px">
        {list.map(([k, c]) => <div key={k} class="chip">{k}<small>{`×${c}`}</small></div>)}
      </div>
      <div class="meta" style="margin-top:6px">{legend}</div>
    </div>
  );
}

export function Report({ s, history }) {
  const total = s.total;
  const digitTotal = total * 4;
  const sorted = s.digit.map((c, d) => ({ d, c })).sort((x, y) => y.c - x.c || x.d - y.d);
  const top4 = new Set(sorted.slice(0, 4).map((r) => r.d));
  const types = Object.keys(s.types).filter((k) => s.types[k] > 0).sort((x, y) => s.types[y] - s.types[x]);
  const exLimit = history ? 8 : 14;
  return (
    <div>
      <Panel title={t('Digit frequency (0-9)')}>
        <Bars rows={sorted.map((r) => ({ k: r.d, v: r.c, hot: top4.has(r.d), label: `${pct(r.c, digitTotal)}%` }))} />
        <div class="meta" style="margin-top:8px">{t('Top 4 digits are highlighted')}</div>
      </Panel>

      <Panel title={t('Number formats')}>
        {types.map((k) => {
          const nums = Object.entries(s.byType[k]).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, exLimit);
          return (
            <div key={k} class="fmt">
              <div class="fmt-head"><span><b>{k}</b> · {t(TYPE_NAMES[k])}</span><span>{s.types[k]} · {pct(s.types[k], total)}%</span></div>
              <div class="fmt-nums">{nums.map(([n, c]) => <span key={n} class="fmt-n">{n}{c > 1 ? <em>×{c}</em> : null}</span>)}</div>
            </div>
          );
        })}
        <div class="meta" style="margin-top:8px">{t('ABCD all different · AABC one pair · AABB two pairs · AAAB triple · AAAA four same')}</div>
      </Panel>

      <Panel title={history ? t('Most repeated last 3 digits') : t('Repeated last 3 digits')}>
        <Chips list={s.topLast3} />
      </Panel>

      <Panel title={t('Best digit in each position')}>
        <div class="stats four">
          {['1st place', '2nd place', '3rd place', '4th place'].map((l, i) => {
            const m = Math.max(...s.pos[i]);
            return <Stat key={l} v={s.pos[i].indexOf(m)} l={t(l)} />;
          })}
        </div>
      </Panel>

      <Panel title={t('Odd / even and low / high')}>
        <Versus title={t('Odd vs even digits')} a={pct(s.oddDigits, digitTotal)} la={t('Odd')} lb={t('Even')} hint={t('Odd = 1 3 5 7 9 · Even = 0 2 4 6 8')} />
        <Versus title={t('Low vs high digits')} a={pct(s.lowDigits, digitTotal)} la={t('Low')} lb={t('High')} hint={t('Low = 0 to 4 · High = 5 to 9')} />
        <Versus title={t('Numbers ending odd vs even')} a={pct(s.oddNumbers, total)} la={t('Odd')} lb={t('Even')} hint={t('Looks only at the last digit of each number')} />
        <div class="vs-title" style="margin-top:14px">{t('Most common odd/even shape')}</div>
        <Patterns list={s.topOe} legend={t('O = odd digit, E = even digit (e.g. OEOE = odd, even, odd, even)')} />
        <div class="vs-title" style="margin-top:14px">{t('Most common low/high shape')}</div>
        <Patterns list={s.topHl} legend={t('L = low digit (0-4), H = high digit (5-9)')} />
      </Panel>

      <Panel title={t('Same digits, different order')}>
        {s.boxGroups.length === 0 ? <div class="meta">{history ? t('No such sets found') : t('No such sets in this draw')}</div> : (
          <div class="boxsets">{s.boxGroups.slice(0, 6).map((g, i) => <div key={i} class="boxset">{g.join('  ·  ')}</div>)}</div>
        )}
      </Panel>

      <Panel title={t('Most repeated numbers')}>
        {history
          ? <Chips list={s.hotNumbers} />
          : (s.repeats.length === 0 ? <div class="meta">{t('No number repeated')}</div> : <Chips list={s.repeats} />)}
      </Panel>

      {history && (
        <Panel title={t('Not seen for the longest')}>
          {s.overdue && s.overdue.length ? <Chips list={s.overdue} fmt={(i) => t('{n} draws ago', { n: i })} /> : <div class="meta">{t('Needs more draws')}</div>}
        </Panel>
      )}

    </div>
  );
}

export function AnalysisToday({ data, gameId, date }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const latest = latestOf(data.results, gameId);
  const draw = date ? drawsOf(data.results, gameId).find((d) => d.date === date) : latest;
  const old = !!(draw && latest && draw.date !== latest.date);
  return (
    <div data-game={g.id}>
      <BackBar title={old ? t('Analysis of this draw') : t("Today's analysis")} />
      <Hero kicker={g.name} title={old ? t('Analysis of this draw') : t("Today's result analysis")} pill={draw ? fmtShort(draw.date) : '-'} />
      {!draw ? <Panel><div class="empty">{t('Analysis appears after the latest result is in.')}</div></Panel> : <Report s={analyze([draw])} />}
    </div>
  );
}

export function AnalysisHistory({ data, gameId, date }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId).filter((d) => !date || d.date <= date);
  return (
    <div data-game={g.id}>
      <BackBar title={t('History analysis')} />
      <Hero kicker={g.name} title={t('Patterns over time')} pill={t('{n} draws', { n: draws.length })} />
      {draws.length === 0 ? <Panel><div class="empty">{t('History analysis appears once draws are stored.')}</div></Panel> : <Report s={analyze(draws)} history />}
    </div>
  );
}

const onlyTop3 = (d) => ({ ...d, special: [], consolation: [] });

export function AnalysisTop3({ data, gameId, date }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const list = drawsOf(data.results, gameId).filter((d) => !date || d.date <= date).map(onlyTop3);
  return (
    <div data-game={g.id}>
      <BackBar title={t('Top 3 history analysis')} />
      <Hero kicker={g.name} title={t('1st, 2nd and 3rd prize over time')} pill={t('{n} draws', { n: list.length })} />
      {list.length === 0 ? <Panel><div class="empty">{t('History analysis appears once draws are stored.')}</div></Panel> : <Report s={analyze(list)} history />}
    </div>
  );
}

// Three separate cards under a result: Top 3, Today's (or this draw's) and History analysis
export function AnalysisCards({ g, draw, latest, user }) {
  const isLatest = !latest || draw.date === latest.date;
  const dest = (k) => (user ? `/analysis/${k}/${g.id}/${draw.date}` : '/locked');
  const rows = [
    ['top3', <IconBars />, t('Top 3 history analysis'), t('1st, 2nd and 3rd prize across all draws')],
    ['today', <IconBars />, isLatest ? t("Today's result analysis") : t('Analysis of this draw'), t('Doubles, hot digits, formats and more')],
    ['history', <IconClock />, t('History analysis'), t('Patterns across all stored draws')],
  ];
  return (
    <div class="acards">
      {rows.map(([k, ic, title, sub]) => (
        <button key={k} class="acard" onClick={() => go(dest(k))}>
          <span class="aicon">{ic}</span>
          <span class="atext"><b>{title}</b><small>{sub}</small></span>
          <span class="chev">{user ? <IconChevron /> : <IconLock />}</span>
        </button>
      ))}
    </div>
  );
}
