import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { GAMES, fmtShort } from '../data/games.js';
import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';
import { LuckyGame } from './LuckyGame.jsx';
import { Locked } from '../ui.jsx';
import { go } from '../App.jsx';
import { FORMATS, addLucky } from '../data/community.js';
import { targetDraw } from '../data/rules.js';
import { requestRewarded } from '../ads.jsx';

const MAXSETS = 4;
const KEY = 'qd_lucky';
const SKEY = 'qd_scratch';
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const REEL_H = 78;
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* ignore */ }
  if (!s || typeof s !== 'object') s = {};
  if (s.day !== dayKey()) { s.day = dayKey(); s.used = 0; s.unlocked = false; }
  return s;
}
function persist(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
function loadScratch(uid) {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(`${SKEY}_${uid}`)); } catch (e) { /* ignore */ }
  return s && s.day === dayKey() ? s : null;
}
const gShort = (g) => g.name.replace(' 4D', '').replace(' 1+3D', '').replace('Sports ', '').replace('Grand Dragon Lotto', 'GD Lotto');

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

function FormatPick({ value, onChange }) {
  return (
    <div class="chipwrap" style="margin:10px 0 0;justify-content:center">
      {FORMATS.map((f) => <button key={f} class={value === f ? 'chip-btn on small' : 'chip-btn small'} onClick={() => onChange(f)}>{t(f)}</button>)}
    </div>
  );
}

function ScratchCard({ user, toast, game }) {
  const more = () => requestRewarded(() => { setSaved(false); make(); });
  const [card, setCard] = useState(() => loadScratch(user.uid));
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState('Straight');
  const [saved, setSaved] = useState(false);
  const cv = useRef(null);
  const g = (card && card.game) || game;
  const make = () => {
    const n = randomDigits(4).join('');
    const c = { day: dayKey(), n, game, revealed: false };
    try { localStorage.setItem(`${SKEY}_${user.uid}`, JSON.stringify(c)); } catch (e) { /* ignore */ }
    setCard(c); setOpen(true);
  };
  const reveal = () => {
    const c = { ...card, revealed: true };
    try { localStorage.setItem(`${SKEY}_${user.uid}`, JSON.stringify(c)); } catch (e) { /* ignore */ }
    setCard(c);
  };
  useEffect(() => {
    const el = cv.current;
    if (!el || !card || card.revealed) return undefined;
    const w = el.clientWidth; const h = el.clientHeight; const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = w * dpr; el.height = h * dpr;
    const x = el.getContext('2d'); x.scale(dpr, dpr);
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#B9BDC7'); gr.addColorStop(0.5, '#E4E6EC'); gr.addColorStop(1, '#A7ABB6');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#6B7080'; x.font = 'bold 15px Arial'; x.textAlign = 'center'; x.fillText(t('Scratch here'), w / 2, h / 2 + 5);
    let down = false; let cnt = 0;
    const scratch = (e) => {
      if (!down) return;
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left; const py = e.clientY - r.top;
      x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(px, py, 20, 0, 7); x.fill();
      cnt += 1;
      if (cnt % 8 === 0) {
        const d = x.getImageData(0, 0, el.width, el.height).data; let clear = 0;
        for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear += 1;
        if (clear / (d.length / 64) > 0.5) { down = false; reveal(); }
      }
      if (e.cancelable) e.preventDefault();
    };
    const dn = (e) => { down = true; scratch(e); };
    const up = () => { down = false; };
    el.addEventListener('pointerdown', dn); el.addEventListener('pointermove', scratch); window.addEventListener('pointerup', up);
    return () => { el.removeEventListener('pointerdown', dn); el.removeEventListener('pointermove', scratch); window.removeEventListener('pointerup', up); };
  }, [card && card.n, card && card.revealed, open]);

  const save = () => { addLucky(user.uid, card.n, card.game, fmt); setSaved(true); toast(t('Saved to your profile')); };
  const used = !!card;
  return (
    <div>
      <div class="section-title"><h2>{t('Scratch card')}</h2><span>{used ? t('Used today') : t('1 free per day')}</span></div>
      <Panel>
        {!used && <button class="btn" onClick={make}>{t('Get my scratch card')}</button>}
        {!used && <div class="meta" style="margin-top:8px;text-align:center">{t('Uses the game selected above. No ad needed.')}</div>}
        {used && (
          <div data-game={card.game}>
            <div class="meta" style="text-align:center;margin-bottom:8px">{gShort(GAMES.find((x) => x.id === card.game) || { name: card.game })} · {t('Draw')} {fmtShort(targetDraw(card.game))}</div>
            <div class="scratch">
              <div class="scratch-n">{card.n}</div>
              {!card.revealed && <canvas ref={cv} class="scratch-cv" />}
            </div>
            {card.revealed && (
              <div>
                <FormatPick value={fmt} onChange={setFmt} />
                <button class="btn" style="margin-top:12px" disabled={saved} onClick={save}>{saved ? t('Saved') : t('Save to profile')}</button>
                <button class="btn ghost" style="margin-top:10px" onClick={more}>{t('Watch an ad for one more card')}</button>
              </div>
            )}
            {!card.revealed && <div class="meta" style="text-align:center;margin-top:8px">{t('Scratch with your finger to reveal')}</div>}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function Lucky({ user, toast }) {
  const [state, setState] = useState(load);
  const [game, setGame] = useState('magnum');
  const [digits, setDigits] = useState(null);
  const [num, setNum] = useState(null);
  const [fmt, setFmt] = useState('Straight');
  const [saved, setSaved] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!adOpen || count <= 0) return undefined;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [adOpen, count]);
  useEffect(() => { if (import.meta.env.DEV && user && location.search.includes('autospin')) finishGame('4350'); }, []);

  if (!user) return (<div><BackBar title={t('Lucky Game Number')} /><Locked onLogin={() => go('/login')} /></div>);

  const update = (fn) => { const s = load(); fn(s); persist(s); setState(s); };
  const needAd = state.used >= 1 && !state.unlocked;
  const full = state.used >= MAXSETS;
  const left = full ? 0 : MAXSETS - state.used;

  const openGame = () => {
    if (spinning) return;
    if (full) { toast(t('You have used all 4 sets today. Come back tomorrow.')); return; }
    if (needAd) { setAdOpen(true); setCount(3); return; }
    setPlaying(true);
  };
  const finishGame = (score) => {
    setPlaying(false);
    const n = String(score).padStart(4, '0');
    setNum(n); setDigits(n.split('').map(Number)); setDone(false); setSaved(false); setSpinning(true); setSpinKey((k) => k + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setSpinning(false); setDone(true); }, 1500 + 3 * 350 + 250);
  };
  const claim = () => { update((s) => { s.unlocked = true; }); setAdOpen(false); setPlaying(true); };
  const save = () => { addLucky(user.uid, num, game, fmt); setSaved(true); toast(t('Saved to your profile')); };
  const gobj = GAMES.find((g) => g.id === game);

  return (
    <div data-game={game}>
      <BackBar title={t('Lucky Game Number')} />
      <Hero kicker={t('Just for fun')} title={t('Play for your lucky number')} pill={t('{n} sets left today', { n: left })} />

      <div class="meta" style="margin:14px 2px 6px;font-weight:700">{t('1. Choose your game')}</div>
      <div class="chipwrap" style="margin-top:0">
        {GAMES.map((g) => <button key={g.id} class={game === g.id ? 'chip-btn on' : 'chip-btn'} onClick={() => { if (g.id !== game) { clearTimeout(timer.current); setGame(g.id); setDigits(null); setNum(null); setDone(false); setSpinning(false); } }}>{gShort(g)}</button>)}
      </div>
      <div class="meta" style="margin:6px 2px 0">{t('For the draw on {d}', { d: fmtShort(targetDraw(game)) })}</div>

      <div class={done ? 'lucky-stage done' : 'lucky-stage'}>
        <div class="reels">
          {[0, 1, 2, 3].map((i) => (digits
            ? <Reel key={i} digit={digits[i]} spinKey={spinKey} index={i} />
            : <div key={i} class="reel"><div class="reel-d idle">?</div></div>))}
        </div>
        {done && <Sparks k={spinKey} />}
        <div class="lucky-note">{done ? t('Your lucky number is ready') : spinning ? t('Revealing your number…') : t('Play the game to get your number')}</div>
        {done && (
          <div>
            <FormatPick value={fmt} onChange={setFmt} />
            <button class="btn" style="margin-top:12px" disabled={saved} onClick={save}>{saved ? t('Saved') : t('Save to profile')}</button>
          </div>
        )}
      </div>

      <button class="btn lucky-btn" onClick={openGame} disabled={spinning || full}>
        {full ? t('Come back tomorrow') : needAd ? t('Watch ad to play more') : (digits ? t('Play again') : t('Play to get my number'))}
      </button>
      <div class="meta" style="text-align:center;margin-top:8px;line-height:1.5">{t('1 free set. Watch one ad to unlock up to 3 more. Max 4 sets a day.')}</div>

      <ScratchCard user={user} toast={toast} game={game} />

      <button class="btn ghost" style="margin-top:16px" onClick={() => go('/profile')}>{t('See my lucky numbers')}</button>
      <div class="meta" style="margin-top:12px;line-height:1.5">{t('Random numbers for fun only. No win is guaranteed.')}</div>

      {playing && <LuckyGame game={game} onStart={() => update((st) => { st.used += 1; })} onFinish={finishGame} onClose={() => setPlaying(false)} />}

      {adOpen && (
        <div class="ad-wrap">
          <div class="ad-box">
            <div class="ad-tag">{t('Ad (test)')}</div>
            <div class="ad-body">{t('A short ad will play here.')}</div>
            <button class="btn" disabled={count > 0} onClick={claim}>{count > 0 ? t('Wait {n}s', { n: count }) : t('Unlock 3 more sets')}</button>
            <button class="btn text" style="margin-top:6px" onClick={() => setAdOpen(false)}>{t('Close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
