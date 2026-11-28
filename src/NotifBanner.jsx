// Pop-up banner at the top (like Facebook / Instagram) for new likes, shares, follows, wins and announcements.
// With Firebase push, the same banner is shown when a message arrives while the app is open.
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { t } from './i18n.js';
import { go } from './App.jsx';
import { notifOnNow, seenOf } from './data/inbox.js';
import { buildAlerts, alertTitle } from './data/alerts.js';

const TXT = { like: ['❤️', '{n} liked your post'], share: ['↗️', '{n} shared your post'], follow: ['👤', '{n} started following you'], challenge: ['⚔️', '{n} accepted your challenge'] };
let shownFor = null; // session start summary is shown once per login

export function NotifBanner({ user, data }) {
  const [b, setB] = useState(null);
  const timer = useRef(null);
  const drag = useRef(null);
  const [off, setOff] = useState({ x: 0, y: 0, on: false });
  const show = (icon, title, sub) => {
    if (!notifOnNow()) return;
    clearTimeout(timer.current); setB({ icon, title, sub, k: Date.now() });
    timer.current = setTimeout(() => setB(null), 5000);
  };
  useEffect(() => {
    const h = (e) => {
      const { toUid, item } = e.detail || {};
      if (!user || toUid !== user.uid) return;
      const [icon, txt] = TXT[item.type] || ['🔔', '{n}'];
      show(icon, t(txt, { n: item.from }), '');
    };
    window.addEventListener('qd-inbox', h);
    return () => window.removeEventListener('qd-inbox', h);
  }, [user && user.uid]);
  // when the app opens: tell about wins / results / announcements the user has not opened yet
  useEffect(() => {
    if (!user || !data || data.status !== 'ready' || shownFor === user.uid) return;
    shownFor = user.uid;
    const seen = new Set(seenOf(user.uid));
    const fresh = buildAlerts(user, data.results).filter((a) => !seen.has(a.id));
    const win = fresh.find((a) => a.won);
    const ann = ((data && data.announcements) || []).filter((a) => !seen.has(a.id))[0];
    if (win) show('🎉', alertTitle(win), '');
    else if (fresh.length) show('•', t('{n} new result alerts', { n: fresh.length }), '');
    else if (ann) show('🔔', t(ann.title), t(ann.body));
  }, [user && user.uid, data && data.status]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setOff({ x: 0, y: 0, on: false }); }, [b && b.k]);
  if (!b) return null;
  // swipe left, right or up to dismiss; a plain tap opens the notifications
  const down = (e) => { clearTimeout(timer.current); drag.current = { sx: e.clientX, sy: e.clientY, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const x = e.clientX - d.sx; const y = Math.min(0, e.clientY - d.sy);
    if (Math.abs(x) > 6 || y < -6) d.moved = true;
    setOff({ x, y, on: true });
  };
  const up = () => {
    const d = drag.current; drag.current = null; if (!d) return;
    if (d.moved && (Math.abs(off.x) > 70 || off.y < -35)) {
      setOff({ x: off.x > 0 ? 500 : off.x < 0 ? -500 : 0, y: off.x === 0 ? -200 : off.y, on: true, out: true });
      setTimeout(() => setB(null), 180);
    } else if (!d.moved) { setB(null); go('/notifications'); }
    else { setOff({ x: 0, y: 0, on: false }); timer.current = setTimeout(() => setB(null), 3000); }
  };
  const st = off.on ? `transform:translate(calc(-50% + ${off.x}px), ${off.y}px);opacity:${off.out ? 0 : 1 - Math.min(0.6, Math.abs(off.x) / 400)};transition:${off.out ? 'transform .18s ease-out, opacity .18s' : 'none'}` : '';
  return createPortal(
    <button key={b.k} class="nbanner" style={st} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <span class="n">{b.icon}</span>
      <span style="flex:1;min-width:0;text-align:left"><b>{b.title}</b>{b.sub && <small>{b.sub}</small>}</span>
    </button>,
    document.body,
  );
}
