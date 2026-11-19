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
  catch: (c) => tone(520 + Math.min(c, 20) * 28, 0.09, 0.18, 'sine'),
  star: () => { tone(988, 0.25, 0.2, 'sine'); tone(1480, 0.3, 0.14, 'sine', 0.06); },
  bomb: () => { noise(0.35, 260, 0.7); tone(140, 0.3, 0.3, 'sawtooth', 0, 50); },
  level: () => { tone(660, 0.18, 0.2, 'triangle'); tone(880, 0.18, 0.2, 'triangle', 0.12); tone(1320, 0.4, 0.2, 'triangle', 0.24); },
  over: () => { tone(440, 0.25, 0.2, 'triangle'); tone(330, 0.25, 0.2, 'triangle', 0.2); tone(220, 0.5, 0.22, 'triangle', 0.4); },
  start: () => tone(700, 0.12, 0.2, 'sine', 0, 1100),
};

const pad4 = (n) => String(Math.max(0, Math.min(9999, n))).padStart(4, '0');
const MAX = 9999;

export function LuckyGame({ game, onStart, onFinish, onClose }) {
  const cvRef = useRef(null);
  const st = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [final, setFinal] = useState({ score: 0, level: 0 });
  const [sound, setSoundState] = useState(() => { try { return localStorage.getItem('qd_sound') !== '0'; } catch (e) { return true; } });
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const toggleSound = () => { const v = !sound; setSoundState(v); try { localStorage.setItem('qd_sound', v ? '1' : '0'); } catch (e) { /* ignore */ } };
  const play = (name, a) => { if (soundRef.current) SND[name](a); };

  const start = () => {
    ac();
    onStart();
    const cv = cvRef.current;
    const w = window.innerWidth; const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr;
    const accent = (getComputedStyle(cv.parentNode).getPropertyValue('--gold') || '#E8B94A').trim();
    st.current = { w, h, dpr, accent, score: 0, lives: 3, level: 0, items: [], t: 0, spawn: 0.4, combo: 0, bx: w / 2, banner: 0, shake: 0, stars: Array.from({ length: 40 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: Math.random() * 1.6 + 0.4 })), floats: [], last: 0, raf: 0, ended: false };
    play('start');
    setPhase('play');
    const s = st.current;
    const bw = () => Math.max(56, 92 - 2 * Math.min(s.level, 18));
    const by = () => s.h - 121;
    const finish = () => {
      if (s.ended) return; s.ended = true; cancelAnimationFrame(s.raf);
      play('over'); setFinal({ score: s.score, level: s.level }); setPhase('over');
    };
    s.finish = finish;
    const move = (e) => { const x = e.touches ? e.touches[0].clientX : e.clientX; s.bx = Math.max(bw() / 2, Math.min(s.w - bw() / 2, x)); if (e.cancelable) e.preventDefault(); };
    cv.onpointermove = move; cv.onpointerdown = move; cv.ontouchmove = move; cv.ontouchstart = move;

    const ctx = cv.getContext('2d');
    const loop = (ts) => {
      if (s.ended) return;
      const dt = Math.min(0.04, (ts - (s.last || ts)) / 1000); s.last = ts; s.t += dt;
      const lv = Math.min(s.level, 16);
      // spawn
      s.spawn -= dt;
      if (s.spawn <= 0) {
        s.spawn = Math.max(0.24, 0.75 - 0.035 * lv) * (0.8 + Math.random() * 0.4);
        const r = Math.random();
        const bombP = Math.min(0.45, 0.16 + 0.02 * lv);
        const type = r < bombP ? 'bomb' : r < bombP + 0.05 ? 'star' : 'ball';
        const fast = lv >= 8 && Math.random() < 0.3 ? 1.35 : 1;
        s.items.push({ type, x: 26 + Math.random() * (s.w - 52), y: -26, vy: (230 + 34 * lv) * (0.85 + Math.random() * 0.35) * fast, r: type === 'ball' ? 21 : 19, n: Math.floor(Math.random() * 10), drift: lv >= 5 ? (Math.random() - 0.5) * 20 * (lv - 4) : 0, ph: Math.random() * 6 });
      }
      // update
      const baseY = by(); const half = bw() / 2;
      for (let i = s.items.length - 1; i >= 0; i -= 1) {
        const it = s.items[i];
        it.y += it.vy * dt; it.x += Math.sin(s.t * 2 + it.ph) * it.drift * dt;
        if (it.y + it.r >= baseY && it.y - it.r <= baseY + 22 && Math.abs(it.x - s.bx) < half + it.r * 0.4) {
          s.items.splice(i, 1);
          if (it.type === 'bomb') { s.lives -= 1; s.combo = 0; s.shake = 0.4; play('bomb'); s.floats.push({ x: it.x, y: baseY - 10, txt: '-1', life: 0.8 }); }
          else if (it.type === 'star') { s.score += 100; play('star'); s.floats.push({ x: it.x, y: baseY - 10, txt: '+100', life: 0.8 }); }
          else { s.combo += 1; const mult = Math.min(4, 1 + Math.floor(s.combo / 10)); s.score += 15 * mult; play('catch', s.combo); if (s.combo % 10 === 0) s.floats.push({ x: s.bx, y: baseY - 30, txt: `x${mult}`, life: 0.9 }); }
        } else if (it.y > s.h + 30) { if (it.type === 'ball') s.combo = 0; s.items.splice(i, 1); }
      }
      if (s.score >= MAX) { s.score = MAX; finish(); return; }
      const nl = Math.floor(s.score / 100);
      if (nl > s.level) { s.level = nl; s.banner = 1.4; play('level'); }
      if (s.lives <= 0) { finish(); return; }
      s.shake = Math.max(0, s.shake - dt); s.banner = Math.max(0, s.banner - dt);
      s.floats.forEach((f) => { f.y -= 40 * dt; f.life -= dt; }); s.floats = s.floats.filter((f) => f.life > 0);

      // draw
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      const sx = s.shake > 0 ? (Math.random() - 0.5) * 10 : 0;
      ctx.save(); ctx.translate(sx, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, s.h); bg.addColorStop(0, '#07070b'); bg.addColorStop(1, '#14141c');
      ctx.fillStyle = bg; ctx.fillRect(-20, 0, s.w + 40, s.h);
      ctx.fillStyle = '#ffffff'; s.stars.forEach((p) => { p.y += 12 * dt * p.s; if (p.y > s.h) p.y = 0; ctx.globalAlpha = 0.25 + p.s * 0.15; ctx.fillRect(p.x, p.y, p.s, p.s); }); ctx.globalAlpha = 1;
      s.items.forEach((it) => {
        if (it.type === 'ball') {
          const g = ctx.createRadialGradient(it.x - 7, it.y - 8, 2, it.x, it.y, it.r); g.addColorStop(0, '#fff'); g.addColorStop(0.3, s.accent); g.addColorStop(1, '#3a2b05');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(it.x, it.y, it.r * 0.52, 0, 7); ctx.fill();
          ctx.fillStyle = '#111'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.n, it.x, it.y + 1);
        } else if (it.type === 'star') {
          ctx.fillStyle = '#fff3a0'; ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 14; ctx.font = '34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', it.x, it.y); ctx.shadowBlur = 0;
        } else {
          const g = ctx.createRadialGradient(it.x - 6, it.y - 6, 2, it.x, it.y, it.r); g.addColorStop(0, '#666'); g.addColorStop(1, '#0b0b0b');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, 7); ctx.fill();
          ctx.strokeStyle = '#c9a15a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(it.x + 6, it.y - it.r + 2); ctx.quadraticCurveTo(it.x + 14, it.y - it.r - 8, it.x + 10, it.y - it.r - 14); ctx.stroke();
          ctx.fillStyle = Math.sin(s.t * 20) > 0 ? '#ff5a3c' : '#ffd54a'; ctx.beginPath(); ctx.arc(it.x + 10, it.y - it.r - 14, 4, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', it.x, it.y + 1);
        }
      });
      // basket
      const bwid = bw();
      ctx.fillStyle = s.accent; ctx.beginPath(); ctx.moveTo(s.bx - bwid / 2, baseY); ctx.lineTo(s.bx + bwid / 2, baseY); ctx.lineTo(s.bx + bwid / 2 - 9, baseY + 36); ctx.lineTo(s.bx - bwid / 2 + 9, baseY + 36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(s.bx - bwid / 2, baseY, bwid, 5);
      // floats
      ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; s.floats.forEach((f) => { ctx.globalAlpha = Math.min(1, f.life * 1.4); ctx.fillStyle = f.txt === '-1' ? '#ff6a5a' : '#fff'; ctx.fillText(f.txt, f.x, f.y); }); ctx.globalAlpha = 1;
      // HUD
      ctx.fillStyle = s.accent; ctx.font = 'bold 36px "Space Grotesk", Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(pad4(s.score), s.w / 2, 62);
      ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#ddd'; ctx.textAlign = 'right'; ctx.fillText(`LV ${s.level + 1}`, s.w - 16, 100);
      ctx.textAlign = 'left'; ctx.fillStyle = '#ff6a7a'; ctx.font = '20px Arial'; ctx.fillText('♥'.repeat(Math.max(0, s.lives)), 16, 100);
      if (s.banner > 0) { ctx.globalAlpha = Math.min(1, s.banner); ctx.fillStyle = '#fff'; ctx.font = 'bold 34px "Space Grotesk", Arial'; ctx.textAlign = 'center'; ctx.fillText(`LEVEL ${s.level + 1}`, s.w / 2, s.h / 2 - 40); ctx.globalAlpha = 1; }
      ctx.restore();
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  };

  useEffect(() => () => { const s = st.current; if (s) { s.ended = true; cancelAnimationFrame(s.raf); } }, []);

  const quit = () => { const s = st.current; if (phase === 'play' && s && !s.ended) s.finish(); else onClose(); };

  return createPortal(
    <div class="game-wrap" data-game={game}>
      <canvas ref={cvRef} class="game-cv" style={phase === 'intro' ? 'display:none' : ''} />
      <button class="game-x" aria-label={t('Close')} onClick={quit}>×</button>
      <button class="game-snd" aria-label="Sound" onClick={toggleSound}>{sound ? '🔊' : '🔇'}</button>
      {phase === 'intro' && (
        <div class="game-panel">
          <div class="game-title">{t('Lucky Game Number')}</div>
          <div class="game-how">
            <div>🟡 {t('Catch the golden balls')}</div>
            <div>💣 {t('Dodge the bombs (3 lives)')}</div>
            <div>👆 {t('Drag your finger to move the basket')}</div>
            <div>📈 {t('Every 100 points the game gets faster')}</div>
          </div>
          <div class="meta" style="margin:10px 0 16px;line-height:1.5">{t('Your final score becomes your lucky number.')}</div>
          <button class="btn" onClick={start}>{t('Start')}</button>
        </div>
      )}
      {phase === 'over' && (
        <div class="game-panel">
          <div class="game-title">{t('Game over')}</div>
          <div class="meta">{t('Your lucky number')}</div>
          <div class="game-score">{pad4(final.score)}</div>
          <div class="meta" style="margin-bottom:16px">{t('Level {n}', { n: final.level + 1 })}</div>
          <button class="btn" onClick={() => onFinish(final.score)}>{t('Use this number')}</button>
        </div>
      )}
    </div>,
    document.body
  );
}
