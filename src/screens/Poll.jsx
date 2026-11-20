import { useState } from 'preact/hooks';
import { GAMES, fmtShort } from '../data/games.js';
import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';
import { POLL_GAMES } from '../config.js';
import { pollDraw, myVote, castVote, tally } from '../data/poll.js';
import { requestInterstitial, AdBanner } from '../ads.jsx';

const PG = GAMES.filter((g) => POLL_GAMES.includes(g.id));
const LETTERS = ['A', 'B', 'C', 'D'];

const ORD = ['1st digit', '2nd digit', '3rd digit', '4th digit'];
function Results({ game, mine }) {
  const r = tally(game, mine);
  return (
    <div>
      <div class="meta" style="margin:2px 2px 10px">{t('{n} players voted', { n: r.total })}</div>
      <div class="pollwin">
        <div class="meta" style="font-weight:700">{t('Most picked number')}</div>
        <div class="pollmine">{r.top.map((d, i) => <span key={i}>{d}</span>)}</div>
        <div class="meta" style="font-size:12px">{t('Each box shows the digit most players picked in that place.')}</div>
      </div>
      {LETTERS.map((L, i) => {
        const order = r.pct[i].map((p, d) => ({ p, d })).sort((x, y) => y.p - x.p);
        const max = order[0].p;
        const myD = mine ? Number(mine[i]) : -1;
        const myRank = order.findIndex((o) => o.d === myD) + 1;
        return (
          <div key={L} class="pollcard">
            <div class="pollhead"><b>{L}</b><span class="meta">{t(ORD[i])}</span></div>
            {order.slice(0, 5).map((o, k) => (
              <div key={o.d} class={'prow' + (k === 0 ? ' top' : '') + (o.d === myD ? ' mine' : '')}>
                <span class="pdig">{o.d}</span>
                <span class="ptrack"><span style={`width:${Math.max(6, (o.p / max) * 100)}%`} /></span>
                <span class="ppct">{o.p.toFixed(1)}%</span>
                {o.d === myD && <em>{t('You')}</em>}
              </div>
            ))}
            {myRank > 5 && <div class="meta" style="margin-top:6px">{t('Your digit {d} is number {r} here', { d: myD, r: myRank })}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function Poll({ user, toast }) {
  const [game, setGame] = useState(POLL_GAMES[0]);
  const [vals, setVals] = useState(['', '', '', '']);
  const [act, setAct] = useState(0);
  const [, tick] = useState(0);
  const [shown, setShown] = useState(false);
  const mine = myVote(user.uid, game);
  const full = vals.every((v) => v !== '');

  const pickGame = (id) => { if (id !== game) { setGame(id); setVals(['', '', '', '']); setAct(0); setShown(false); } };
  const press = (d) => {
    const v = vals.slice(); v[act] = String(d); setVals(v);
    const nxt = v.findIndex((x) => x === '');
    setAct(nxt < 0 ? Math.min(act + 1, 3) : nxt);
  };
  const clear = () => { setVals(['', '', '', '']); setAct(0); };
  const vote = () => {
    if (!full) return;
    if (castVote(user.uid, game, vals.join(''))) { toast(t('Vote saved')); tick((n) => n + 1); }
  };
  const reveal = () => requestInterstitial(() => setShown(true));
  const g = GAMES.find((x) => x.id === game);

  return (
    <div data-game={game}>
      <BackBar title={t('Voting Poll')} />
      <Hero kicker={t('Just for fun')} title={t('Which number will come?')} pill={t('One vote per game')} />

      <div class="meta" style="margin:14px 2px 6px;font-weight:700">{t('1. Choose your game')}</div>
      <div class="chipwrap" style="margin-top:0">
        {PG.map((x) => <button key={x.id} class={game === x.id ? 'chip-btn on' : 'chip-btn'} onClick={() => pickGame(x.id)}>{x.id === 'gdlotto' ? 'GD Lotto' : x.name.replace(' 4D', '')}</button>)}
      </div>
      <div class="meta" style="margin:6px 2px 0">{t('For the draw on {d}', { d: fmtShort(pollDraw(game)) })}</div>

      {!mine && (
        <Panel>
          <div class="meta" style="margin-bottom:8px;font-weight:700">{t('2. Pick your 4 digits')}</div>
          <div class="pollboxes">
            {LETTERS.map((L, i) => (
              <button key={L} class={'pbox' + (act === i ? ' on' : '')} onClick={() => setAct(i)} aria-label={`${L} ${vals[i]}`}>
                <small>{L}</small><b>{vals[i] === '' ? '?' : vals[i]}</b>
              </button>
            ))}
          </div>
          <div class="keypad">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <button key={d} class="key" onClick={() => press(d)}>{d}</button>)}
          </div>
          <div style="display:flex;gap:10px;margin-top:12px">
            <button class="btn ghost" style="flex:0 0 38%" onClick={clear}>{t('Clear')}</button>
            <button class="btn" style="flex:1" disabled={!full} onClick={vote}>{t('Vote')}</button>
          </div>
        </Panel>
      )}

      {mine && (
        <Panel>
          <div class="meta" style="text-align:center">{t('Your vote for {g}', { g: g.name })}</div>
          <div class="pollmine">{mine.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
          {!shown && <button class="btn" onClick={reveal}>{t('See what others picked')}</button>}
          {!shown && <div class="meta" style="text-align:center;margin-top:8px">{t('A short ad plays first.')}</div>}
        </Panel>
      )}

      {mine && shown && <Panel title={t('What players picked')}><Results game={game} mine={mine} /></Panel>}
      {mine && shown && <AdBanner />}

      <div class="meta" style="margin-top:14px;line-height:1.5">{t('Votes are for fun only and do not decide any result. No win is guaranteed. 18+')}</div>
    </div>
  );
}
