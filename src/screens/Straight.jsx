import { useState, useEffect, useRef } from 'preact/hooks';
import { gameById, GAMES, fmtShort, todayISO, isDrawDay, isSpecialDraw } from '../data/games.js';
import { Loading, BackBar, Panel, NehroopaCard } from '../ui.jsx';
import { go } from '../App.jsx';
import { t, getLang } from '../i18n.js';
import { IconChevron, IconClock, Logo } from '../icons.jsx';
import { drawsOf } from '../data/store.js';
import { straightChart, straightWins } from '../data/straight.js';
import { STRAIGHT_START } from '../config.js';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { drawStartMs, updateDelayHours } from '../data/rules.js';

const LETTER = { magnum: 'M', toto: 'T', damacai: 'D', singapore: 'S', gdlotto: 'G' };
const shortName = (g) => (g.id === 'gdlotto' ? 'GD Lotto' : g.name);

// next draw date (ISO) that has no result yet
function nextDrawISO(g, draws) {
  const done = new Set(draws.map((d) => d.date));
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 9; i += 1) {
    const x = new Date(base); x.setDate(base.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    if (isDrawDay(g, iso) && !done.has(iso)) return iso;
  }
  return todayISO();
}

// Until the next prediction is published, the chart of the draw that just finished stays on screen with its wins.
// Publish time = draw start + 1h (result) + the usual 2h / 24h delay.
export function showsLatest(g, draws) {
  const L = draws[0];
  if (!L || L.date < STRAIGHT_START) return false;
  const [y, m, d] = L.date.split('-').map(Number);
  let next = null;
  for (let i = 1; i < 9; i += 1) { const x = new Date(Date.UTC(y, m - 1, d + i)); if (isDrawDay(g, x.toISOString().slice(0, 10))) { next = x.toISOString().slice(0, 10); break; } }
  const delay = updateDelayHours(L.date, next || L.date, !!next && isSpecialDraw(g.id, next));
  return Date.now() < drawStartMs(g.id, L.date) + (1 + delay) * 3600e3;
}

export function StraightList({ data }) {
  if (data.status === 'loading' && !data.results) return <Loading />;
  return (
    <div>
      <BackBar title={t('Straight Predictions')} />
      <div style="margin-top:14px">
        {GAMES.map((g) => {
          const draws = drawsOf(data.results, g.id);
          const latest = showsLatest(g, draws);
          const wins = latest ? straightWins(straightChart(draws.slice(1), `${g.id}${draws[0].date}`).cols, draws[0]) : [];
          return (
            <button key={g.id} class="srow" onClick={() => go(`/straight/${g.id}`)}>
              <span class="ring">{LETTER[g.id]}</span>
              <span class="atext"><b>{t(shortName(g))}</b><small>{latest ? "" : `${t(g.region)} · `}{latest ? `${t('Result')}: ${fmtShort(draws[0].date)}` : `${t('Next draw')}: ${fmtShort(nextDrawISO(g, draws))}`}</small></span>
              {wins.length > 0 && <span class="pill gold">{t('Win')} {wins.length}</span>}
              <span class="chev"><IconChevron /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const COLORS = ['#FF5A5F', '#2BB3FF', '#8B5CF6', '#22C55E', '#F97316', '#E11D8A'];
const LANG_TAG = { en: 'en-US', ms: 'ms-MY', zh: 'zh-CN', ta: 'ta-IN', km: 'km-KH' };
const soundOn = () => { try { return localStorage.getItem('qd_voice') !== '0'; } catch (e) { return true; } };

// reads each winning number aloud digit by digit and lights up that digit in its column
function useReader(cols, wins, auto) {
  const [lit, setLit] = useState(() => (auto ? {} : null)); // key "col-row" -> win index
  const stop = useRef(false);
  const full = () => { const m = {}; wins.forEach((w, k) => w.number.split('').forEach((d, i) => { const key = `${i}-${cols[i].indexOf(Number(d))}`; if (!(key in m)) m[key] = k; })); return m; };
  const speak = async (text, onStart) => {
    const lang = LANG_TAG[getLang()] || 'en-US';
    if (Capacitor.isNativePlatform()) {
      onStart();
      try { await TextToSpeech.speak({ text, lang, rate: 0.9, pitch: 1, volume: 1, category: 'ambient' }); return; } catch (e) {
        try { await TextToSpeech.speak({ text, lang: 'en-US', rate: 0.9, pitch: 1, volume: 1, category: 'ambient' }); return; } catch (e2) { /* fall through to silent */ }
      }
      await new Promise((r) => setTimeout(r, 650)); return;
    }
    await new Promise((res) => {
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang; u.rate = 0.85; u.onstart = onStart; u.onend = fin; u.onerror = fin;
        window.speechSynthesis.speak(u);
        setTimeout(fin, 2500);
      } catch (e) { onStart(); setTimeout(fin, 650); }
    });
  };
  const play = async () => {
    stop.current = false;
    if (!wins.length) return;
    if (!soundOn()) { setLit(full()); return; }
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    try { if (Capacitor.isNativePlatform()) await TextToSpeech.stop(); } catch (e) { /* ignore */ }
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
  useEffect(() => { if (auto && wins.length) play(); else if (wins.length) setLit(full()); return () => { stop.current = true; try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } try { if (Capacitor.isNativePlatform()) TextToSpeech.stop(); } catch (e) { /* ignore */ } }; }, []);
  const halt = () => { stop.current = true; try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } try { if (Capacitor.isNativePlatform()) TextToSpeech.stop(); } catch (e) { /* ignore */ } setLit(full()); };
  return { lit: lit || full(), play, halt };
}

function StraightSheet({ g, iso, cols, draw, auto }) {
  const wins = straightWins(cols, draw);
  const { lit, play, halt } = useReader(cols, wins, auto);
  const [voice, setVoice] = useState(soundOn());
  const toggleVoice = () => { const v = !voice; try { localStorage.setItem('qd_voice', v ? '1' : '0'); } catch (e) { /* ignore */ } setVoice(v); if (v) play(); else halt(); };
  return (
    <div>
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
      {wins.length > 0 && (
        <div class="pd-win-box" style="margin-top:12px">
          <div class="pd-win-h">🎉 {wins.length === 1 ? t('1 number won') : t('{n} numbers won', { n: wins.length })}
            <button class={voice ? 'speak on' : 'speak'} onClick={toggleVoice}>{voice ? '🔊' : '🔇'} {voice ? t('Voice on') : t('Voice off')}</button></div>
          {wins.map((w, k) => (
            <div key={k} class="pd-win-row" style={`--rc:${COLORS[k % COLORS.length]}`}>
              <i class="wdot" style={`background:${COLORS[k % COLORS.length]}`} />
              <b class="wnum">{w.number}</b><span class="pill gold">{w.prize === 'Special' ? t(g.special) : t(w.prize)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// past straight charts that actually won something (looks back up to 60 draws)
function winningCharts(g, draws) {
  const off = showsLatest(g, draws) ? 1 : 0;
  return draws.slice(off, off + 60).map((d, i) => ({ d, older: draws.slice(off + i + 1) })).filter((x) => x.older.length > 0 && x.d.date >= STRAIGHT_START)
    .map(({ d, older }) => { const { cols } = straightChart(older, `${g.id}${d.date}`); return { d, cols, wins: straightWins(cols, d) }; })
    .filter((x) => x.wins.length > 0);
}

export function StraightChart({ data, gameId }) {
  const g = gameById(gameId);
  if (!g) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, gameId);
  const latest = showsLatest(g, draws);
  const iso = latest ? draws[0].date : nextDrawISO(g, draws);
  const { cols } = straightChart(latest ? draws.slice(1) : draws, `${gameId}${iso}`);
  const histCount = winningCharts(g, draws).length;
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('Straight Predictions')} />
      <NehroopaCard />
      <div style="margin-top:12px"><StraightSheet key={iso} g={g} iso={iso} cols={cols} draw={latest ? draws[0] : null} auto /></div>
      {histCount > 0 && (
        <div class="acards" style="margin-top:14px">
          <button class="acard" onClick={() => go(`/straighthist/${g.id}`)}>
            <span class="aicon"><IconClock /></span>
            <span class="atext"><b>{t('Winning History Straight Charts')}</b><small>{t('{n} wins', { n: histCount })}</small></span>
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
  const list = winningCharts(g, draws);
  const [open, setOpen] = useState(() => (import.meta.env.DEV && location.search.includes('openph') ? (list.find((x) => x.wins.length) || {}).d?.date : null));
  return (
    <div data-game={g.id} class="pd">
      <BackBar title={t('Winning History Straight Charts')} />
      {list.length === 0 && <div class="empty" style="margin-top:14px">{t('Winning predictions will be listed here after each draw.')}</div>}
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
