import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { t } from '../i18n.js';

// ---- tiny synthesized sounds (no audio files) ----
let AC = null;
function ac() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { /* ignore */ } return AC; }
function tone(f, dur, g, type, when, slide) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + (when || 0);
  const o = a.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  const gn = a.createGain(); gn.gain.setValueAtTime(g, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn); gn.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, f, g) {
  const a = ac(); if (!a) return;
  const n = Math.floor(a.sampleRate * dur); const b = a.createBuffer(1, n, a.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < n; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(); s.buffer = b; const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f;
  const gn = a.createGain(); gn.gain.value = g; s.connect(fl); fl.connect(gn); gn.connect(a.destination); s.start();
}
const SND = {
  start: () => { tone(500, 0.12, 0.2, 'sine', 0, 900); tone(900, 0.2, 0.15, 'triangle', 0.1); },
  shake: () => { noise(0.25, 500, 0.35); tone(180, 0.22, 0.12, 'square', 0, 120); },
  open: (k) => { tone(520 + k * 140, 0.35, 0.22, 'triangle'); tone(1040 + k * 280, 0.4, 0.12, 'sine', 0.05); noise(0.18, 3000, 0.25); },
  done: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, 0.2, 'triangle', i * 0.11)); tone(262, 0.9, 0.18, 'sine', 0.5); },
};
const COLORS = ['#E8B94A', '#E5484D', '#3E9BFF', '#2FBF71', '#B068F2', '#FF8A3D'];
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// Mystery Boxes: 12 boxes hide digits; open 4 to build your lucky number.
export function LuckyGame({ game, onStart, onFinish, onClose }) {
  const [phase, setPhase] = useState('intro');
  const [digits, setDigits] = useState([]);   // hidden digit behind each box
  const [opened, setOpened] = useState([]);   // box indexes in order opened
  const [shaking, setShaking] = useState(-1);
  const [sound, setSoundState] = useState(() => { try { return localStorage.getItem('qd_sound') !== '0'; } catch (e) { return true; } });
  const soundRef = useRef(sound); soundRef.current = sound;
  const busy = useRef(false);
  const toggleSound = () => { const v = !sound; setSoundState(v); try { localStorage.setItem('qd_sound', v ? '1' : '0'); } catch (e) { /* ignore */ } };
  const play = (name, a) => { if (soundRef.current) SND[name](a); };

  const start = () => {
    ac();
    // 15 boxes: every box hides a random digit 0-9 (repeats and doubles are common)
    setDigits(Array.from({ length: 15 }, () => Math.floor(Math.random() * 10))); setOpened([]); onStart(); play('start'); setPhase('play');
  };
  const pick = (i) => {
    if (busy.current || opened.includes(i) || opened.length >= 4) return;
    busy.current = true; setShaking(i); play('shake');
    setTimeout(() => {
      setShaking(-1);
      const next = [...opened, i];
      setOpened(next); play('open', next.length);
      setTimeout(() => {
        busy.current = false;
        if (next.length >= 4) { play('done'); setTimeout(() => setPhase('over'), 700); }
      }, 450);
    }, 550);
  };
  const number = opened.map((i) => digits[i]).join('');

  return createPortal(
    <div class="game-wrap mb" data-game={game}>
      <div class="mb-stars" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={`left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:${(i % 7) * 0.4}s`} />)}</div>
      <button class="game-x" aria-label={t('Close')} onClick={onClose}>×</button>
      <button class="game-snd" aria-label="Sound" onClick={toggleSound}>{sound ? '🔊' : '🔇'}</button>
      {phase === 'intro' && (
        <div class="game-panel">
          <div class="mb-gift">🎁</div>
          <div class="game-title">{t('Mystery Boxes')}</div>
          <div class="game-how">
            <div>🎁 {t('15 mystery boxes hide the digits')}</div>
            <div>👆 {t('Tap 4 boxes to open them')}</div>
            <div>✨ {t('The 4 digits you open become your lucky number')}</div>
          </div>
          <button class="btn" style="margin-top:16px" onClick={start}>{t('Start')}</button>
        </div>
      )}
      {phase === 'play' && (
        <div class="mb-board">
          <div class="mb-title">{t('Pick 4 boxes')}</div>
          <div class="mb-slots">{[0, 1, 2, 3].map((k) => <span key={k} class={opened[k] != null ? 'mb-slot on' : 'mb-slot'}>{opened[k] != null ? digits[opened[k]] : '?'}</span>)}</div>
          <div class="mb-grid">
            {digits.map((d, i) => {
              const isOpen = opened.includes(i);
              const c = COLORS[i % COLORS.length];
              return (
                <button key={i} class={`mb-box${isOpen ? ' open' : ''}${shaking === i ? ' shake' : ''}`} style={`--c:${c}`} disabled={isOpen} aria-label={`${t('Box')} ${i + 1}`} onClick={() => pick(i)}>
                  <span class="mb-lid" />
                  <span class="mb-body">{isOpen ? '' : '?'}</span>
                  {isOpen && <span class="mb-digit">{d}</span>}
                  {isOpen && <span class="mb-burst" aria-hidden="true">{Array.from({ length: 8 }, (_, k) => <i key={k} style={`--a:${k * 45}deg`} />)}</span>}
                </button>
              );
            })}
          </div>
          <div class="mb-hint">{t('{n} of 4 opened', { n: opened.length })}</div>
        </div>
      )}
      {phase === 'over' && (
        <div class="game-panel">
          <div class="game-title">{t('Your lucky number')}</div>
          <div class="game-score">{number}</div>
          <button class="btn" style="margin-top:12px" onClick={() => onFinish(number)}>{t('Use this number')}</button>
        </div>
      )}
    </div>,
    document.body
  );
}
