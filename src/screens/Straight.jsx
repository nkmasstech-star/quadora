import { useState, useEffect, useRef } from 'preact/hooks';
import { gameById, GAMES, fmtShort, todayISO } from '../data/games.js';
import { Loading, BackBar, Panel } from '../ui.jsx';
import { go } from '../App.jsx';
import { t, getLang } from '../i18n.js';
import { IconChevron, IconClock, Logo } from '../icons.jsx';
import { drawsOf, prizeEntries } from '../data/store.js';
import { analyze } from '../data/analysis.js';

const LETTER = { magnum: 'M', toto: 'T', damacai: 'D', singapore: 'S', gdlotto: 'G' };
const shortName = (g) => (g.id === 'gdlotto' ? 'GD Lotto' : g.name);

// next draw date (ISO) that has no result yet
function nextDrawISO(g, draws) {
  const done = new Set(draws.map((d) => d.date));
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 9; i += 1) {
    const x = new Date(base); x.setDate(base.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    if (g.days.includes(x.getDay()) && !done.has(iso)) return iso;
  }
  return todayISO();
}

function rng(seedStr) { // small seeded random so the chart stays the same for one draw
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let x = Math.imul(h ^ (h >>> 15), 1 | h); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 4 columns (A B C D) x 4 rows. The 7 most frequent digits of the history are placed at random;
// a digit never repeats inside one column.
export function straightChart(draws, seed) {
  const s = analyze(draws);
  const top7 = s.digit.map((c, d) => [d, c]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 7).map((x) => x[0]);
  const r = rng(seed);
  const cols = [0, 1, 2, 3].map(() => shuffle(top7, r).slice(0, 4));
  return { top7, cols };
}

export function StraightList({ data }) {
  if (data.status === 'loading' && !data.results) return <Loading />;
  return (
    <div>
      <BackBar title={t('Straight Predictions')} />
      <div style="margin-top:14px">
        {GAMES.map((g) => (
          <button key={g.id} class="srow" onClick={() => go(`/straight/${g.id}`)}>
            <span class="ring">{LETTER[g.id]}</span>
            <span class="atext"><b>{t(shortName(g))}</b><small>{t(g.region)} · {t('Next draw')}: {fmtShort(nextDrawISO(g, drawsOf(data.results, g.id)))}</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

const COLORS = ['#FF5A5F', '#2BB3FF', '#8B5CF6', '#22C55E', '#F97316', '#E11D8A'];
const LANG_TAG = { en: 'en-US', ms: 'ms-MY', zh: 'zh-CN', ta: 'ta-IN', km: 'km-KH' };
const soundOn = () => { try { return localStorage.getItem('qd_sound') !== '0'; } catch (e) { return true; } };

// a prize number wins when its 1st digit is in column A, 2nd in B, 3rd in C and 4th in D (any row)
export function straightWins(cols, draw) {
  if (!draw) return [];
  return prizeEntries(draw).filter((e) => /^\d{4}$/.test(e.number) && e.number.split('').every((d, i) => cols[i].includes(Number(d))));
}

// reads each winning number aloud digit by digit and lights up that digit in its column
function useReader(cols, wins, auto) {
  const [lit, setLit] = useState(() => (auto ? {} : null)); // key "col-row" -> win index
  const stop = useRef(false);
  const full = () => { const m = {}; wins.forEach((w, k) => w.number.split('').forEach((d, i) => { const key = `${i}-${cols[i].indexOf(Number(d))}`; if (!(key in m)) m[key] = k; })); return m; };
  const speak = (text, onStart) => new Promise((res) => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_TAG[getLang()] || 'en-US'; u.rate = 0.85;
      u.onstart = onStart; u.onend = fin; u.onerror = fin;
      window.speechSynthesis.speak(u);
      setTimeout(fin, 2500);
    } catch (e) { onStart(); setTimeout(fin, 650); }
  });
  const play = async () => {
    stop.current = false;
    if (!wins.length) return;
    if (!soundOn()) { setLit(full()); return; }
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    const m = {}; setLit({});
    for (let k = 0; k < wins.length; k += 1) {
      const ds = wins[k].number.split('');
      for (let i = 0; i < 4; i += 1) {
        if (stop.current) return;
        const key = `${i}-${cols[i].indexOf(Number(ds[i]))}`;
        // eslint-disable-next-line no-await-in-loop
        await speak(ds[i], () => { if (!(key in m)) m[key] = k; setLit({ ...m, [key]: k, _now: key }); });
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 450));
    }
    setLit(full());
  };
  useEffect(() => { if (auto && wins.length) play(); else if (wins.length) setLit(full()); return () => { stop.current = true; try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }; }, []);
  return { lit: lit || full(), play };
}

function StraightSheet({ g, iso, cols, draw, auto }) {
  const wins = straightWins(cols, draw);
  const { lit, play } = useReader(cols, wins, auto);
  return (
    <div>
      {wins.length > 0 && (
        <div class="pd-win-box">
          <div class="pd-win-h">🎉 {wins.length === 1 ? t('1 number won') : t('{n} numbers won', { n: wins.length })}
            <button class="speak" onClick={play} aria-label={t('Read aloud')}>🔊</button></div>
          {wins.map((w, k) => (
            <div key={k} class="pd-win-row" style={`--rc:${COLORS[k % COLORS.length]}`}>
              <i class="wdot" style={`background:${COLORS[k % COLORS.length]}`} />
              <b class="wnum">{w.number}</b><span class="pill gold">{w.prize === 'Special' ? t(g.special) : t(w.prize)}</span>
            </div>
          ))}
        </div>
      )}
      <div class="pd-sheet">
        <div class="pd-band date">{fmtShort(iso)}</div>
        <div class="pd-band title">{g.name.toUpperCase()}</div>
        <div class="pd-brandtop"><Logo size={28} /><span>Q Spot <em>4D</em> {t('Straight')}</span></div>
        <div class="st-wrap">
          <div class="st-chart">
            {['A', 'B', 'C', 'D'].map((l) => <div key={l} class="st-h">{l}</div>)}
            {[0, 1, 2, 3].map((row) => cols.map((c, ci) => {
              const k = lit[`${ci}-${row}`];
              const on = k !== undefined;
              return <div key={`${row}${ci}`} class={on ? (lit._now === `${ci}-${row}` ? 'st-c on now' : 'st-c on') : 'st-c'} style={on ? `--rc:${COLORS[k % COLORS.length]}` : undefined}>{c[row]}</div>;
            }))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StraightChart({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId);
  const iso = nextDrawISO(g, draws);
  const { cols } = straightChart(draws, `${gameId}${iso}`);
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('Straight Predictions')} />
      <div style="margin-top:12px"><StraightSheet g={g} iso={iso} cols={cols} draw={null} /></div>
      {draws.length > 1 && (
        <div class="acards" style="margin-top:14px">
          <button class="acard" onClick={() => go(`/straighthist/${g.id}`)}>
            <span class="aicon"><IconClock /></span>
            <span class="atext"><b>{t('History Straight Charts')}</b><small>{t('Last {n} draws', { n: Math.min(30, draws.length - 1) })}</small></span>
            <span class="chev"><IconChevron /></span>
          </button>
        </div>
      )}
    </div>
  );
}

export function StraightHistoryPage({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId);
  const list = draws.slice(0, 30).map((d, i) => ({ d, older: draws.slice(i + 1) })).filter((x) => x.older.length > 0)
    .map(({ d, older }) => { const { cols } = straightChart(older, `${gameId}${d.date}`); return { d, cols, wins: straightWins(cols, d) }; });
  const [open, setOpen] = useState(() => (import.meta.env.DEV && location.search.includes('openph') ? (list.find((x) => x.wins.length) || {}).d?.date : null));
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('History Straight Charts')} />
      <div style="margin-top:10px">
        {list.map(({ d, cols, wins }) => {
          const on = open === d.date;
          return (
            <div key={d.date} class="ph">
              <button class="ph-row" onClick={() => setOpen(on ? null : d.date)}>
                <span class="ph-d">{fmtShort(d.date)} <i>{d.date.slice(0, 4)}</i></span>
                {wins.length > 0 && <span class="pill gold">{t('Win')} {wins.length}</span>}
                <span class="chev" style={on ? 'transform:rotate(90deg)' : ''}><IconChevron /></span>
              </button>
              {on && <StraightSheet g={g} iso={d.date} cols={cols} draw={d} auto />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
