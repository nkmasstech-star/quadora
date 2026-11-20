// Pop-up banner at the top (like Facebook / Instagram) for new likes, shares, follows, wins and announcements.
// With Firebase push, the same banner is shown when a message arrives while the app is open.
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { t } from './i18n.js';
import { go } from './App.jsx';
import { notifOnNow, seenOf } from './data/inbox.js';
import { buildAlerts, alertTitle } from './data/alerts.js';

const TXT = { like: ['❤️', '{n} liked your post'], share: ['↗️', '{n} shared your post'], follow: ['👤', '{n} started following you'] };
let shownFor = null; // session start summary is shown once per login

export function NotifBanner({ user, data }) {
  const [b, setB] = useState(null);
  const timer = useRef(null);
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
  if (!b) return null;
  return createPortal(
    <button key={b.k} class="nbanner" onClick={() => { setB(null); go('/notifications'); }}>
      <span class="n">{b.icon}</span>
      <span style="flex:1;min-width:0;text-align:left"><b>{b.title}</b>{b.sub && <small>{b.sub}</small>}</span>
    </button>,
    document.body,
  );
}
