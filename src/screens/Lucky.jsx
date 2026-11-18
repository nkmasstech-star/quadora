import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { GAMES, fmtShort } from '../data/games.js';
import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';

const FREE = 2;
const AD_BONUS = 3;
const REEL_H = 78;
const KEY = 'qd_lucky';

const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* ignore */ }
  if (!s || typeof s !== 'object') s = {};
  if (s.day !== dayKey()) { s.day = dayKey(); s.used = 0; s.bonus = 0; }
  if (!Array.isArray(s.list)) s.list = [];
  return s;
}
function persist(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }

function randomDigits(n) {
  const out = [];
  try {
    const a = new Uint32Array(n);
    crypto.getRandomValues(a);
    a.forEach((v) => out.push(v % 10));
  } catch (e) { for (let i = 0; i < n; i += 1) out.push(Math.floor(Math.random() * 10)); }
  return out;
}

function Reel({ digit, spinKey, index }) {
  const ref = useRef(null);
  const strip = useMemo(() => {
    const filler = randomDigits(16);
    return [...filler, digit];
  }, [spinKey]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = 'translateY(0)';
    void el.offsetHeight;
    const r = requestAnimationFrame(() => {
      el.style.transition = `transform ${1.5 + index * 0.35}s cubic-bezier(0.16, 0.9, 0.24, 1)`;
      el.style.transform = `translateY(-${(strip.length - 1) * REEL_H}px)`;
    });
    return () => cancelAnimationFrame(r);
  }, [spinKey]);
  return (
    <div class="reel">
      <div class="reel-strip" ref={ref}>
        {strip.map((d, i) => <div key={i} class="reel-d">{d}</div>)}
      </div>
    </div>
  );
}

function Sparks({ k }) {
  const list = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: (360 / 16) * i + Math.random() * 12, d: 70 + Math.random() * 50, s: 0.6 + Math.random() * 0.8 })), [k]);
  return (
    <div class="sparks" aria-hidden="true">
      {list.map((p, i) => <i key={i} style={`--a:${p.a}deg;--d:${p.d}px;--s:${p.s}`} />)}
    </div>
  );
}

export function Lucky() {
  const [state, setState] = useState(load);
  const [game, setGame] = useState('magnum');
  const [digits, setDigits] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [count, setCount] = useState(3);
  const timer = useRef(null);

  const left = Math.max(0, FREE + state.bonus - state.used);
  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (fn) => { const s = load(); fn(s); persist(s); setState(s); };

  const spin = () => {
    if (spinning) return;
    if (left <= 0) { setAdOpen(true); setCount(3); return; }
    const d = randomDigits(4);
    const num = d.join('');
    setDigits(d); setDone(false); setSpinning(true); setSpinKey((k) => k + 1);
    update((s) => { s.used += 1; s.list.unshift({ n: num, g: game, at: Date.now() }); s.list = s.list.slice(0, 60); });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSpinning(false); setDone(true); }, 1500 + 3 * 350 + 250);
  };

  useEffect(() => {
    if (!adOpen || count <= 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [adOpen, count]);

  useEffect(() => { if (import.meta.env.DEV && location.search.includes('autospin')) spin(); }, []);

  const claim = () => { update((s) => { s.bonus += AD_BONUS; }); setAdOpen(false); };
  const remove = (at) => update((s) => { s.list = s.list.filter((x) => x.at !== at); });

  const shown = spinning ? state.list.slice(1) : state.list;
  const gname = (id) => (GAMES.find((g) => g.id === id) || {}).name || id;

  return (
    <div data-game={game}>
      <BackBar title={t('Lucky Pick')} />
      <Hero kicker={t('Just for fun')} title={t('Your lucky 4D number')} pill={left > 0 ? t('{n} free left', { n: left }) : t('Watch ad')} />

      <div class="chipwrap" style="margin-top:14px">
        {GAMES.map((g) => <button key={g.id} class={game === g.id ? 'chip-btn on' : 'chip-btn'} onClick={() => setGame(g.id)}>{g.name.replace(' 4D', '').replace(' 1+3D', '').replace('Sports ', '').replace('Grand Dragon Lotto', 'GD Lotto')}</button>)}
      </div>

      <div class={done ? 'lucky-stage done' : 'lucky-stage'}>
        <div class="reels">
          {[0, 1, 2, 3].map((i) => (digits
            ? <Reel key={i} digit={digits[i]} spinKey={spinKey} index={i} />
            : <div key={i} class="reel"><div class="reel-d idle">?</div></div>))}
        </div>
        {done && <Sparks k={spinKey} />}
        <div class="lucky-note">{done ? t('Saved to My lucky numbers') : spinning ? t('Picking your number…') : t('Tap the button to pick')}</div>
      </div>

      <button class="btn lucky-btn" onClick={spin} disabled={spinning}>
        {left > 0 ? (digits ? t('Pick again') : t('Pick my lucky number')) : t('Watch ad for {n} more picks', { n: AD_BONUS })}
      </button>
      <div class="meta" style="text-align:center;margin-top:8px">{t('{n} free picks left today', { n: left })}</div>

      <div class="section-title"><h2>{t('My lucky numbers')}</h2><span>{shown.length}</span></div>
      {shown.length === 0 && <Panel><div class="empty">{t('No lucky numbers yet. Tap the button above!')}</div></Panel>}
      {shown.map((x) => (
        <div key={x.at} class="hit" data-game={x.g}>
          <span class="n">{x.n}</span>
          <span style="flex:1"><span style="display:block;font-weight:700;font-size:14px">{gname(x.g)}</span><span class="meta">{fmtShort(new Date(x.at))}</span></span>
          <button class="del-btn" aria-label={t('Delete')} onClick={() => remove(x.at)}>×</button>
        </div>
      ))}
      <div class="meta" style="margin-top:12px;line-height:1.5">{t('Random numbers for fun only. No win is guaranteed.')}</div>

      {adOpen && (
        <div class="ad-wrap">
          <div class="ad-box">
            <div class="ad-tag">{t('Ad (test)')}</div>
            <div class="ad-body">{t('A short ad will play here.')}</div>
            <button class="btn" disabled={count > 0} onClick={claim}>{count > 0 ? t('Wait {n}s', { n: count }) : t('Claim {n} more picks', { n: AD_BONUS })}</button>
            <button class="btn text" style="margin-top:6px" onClick={() => setAdOpen(false)}>{t('Close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
