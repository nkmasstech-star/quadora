// Well-timed share popup. Asks only at a happy moment, never more than once a day:
// 1) a new WIN on one of the player's numbers/posts -> "You won! Share it" (once per win)
// 2) the player keeps coming back (5+ opens) and has used the app for 90 s this session -> "Share Q Spot" (every 14 days)
// Never while another dialog (update / what's new / exit) is open.
import { useEffect, useState } from 'preact/hooks';
import { t } from './i18n.js';
import { buildAlerts } from './data/alerts.js';
import { gameById } from './data/games.js';
import { shareText } from './data/share.js';

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } };
const DAY = 864e5;
const busy = () => !!document.querySelector('.exit-wrap, .sheet, .upd-wrap');
const askedToday = () => Date.now() - (Number(get('qd_sp_last')) || 0) < DAY;

export function SharePrompt({ user, data, toast }) {
  const [p, setP] = useState(() => (import.meta.env.DEV && location.search.includes('sharepop') ? { kind: 'win', a: { game: 'magnum', sub: 'Magnum 4D · 2nd' } } : null)); // { kind: 'win'|'app', a? }

  // 1) win: wait for the top banner to finish first
  useEffect(() => {
    if (!user || !data || data.status !== 'ready' || askedToday()) return;
    const done = new Set(JSON.parse(get('qd_sp_wins') || '[]'));
    const week = Date.now() - 7 * DAY;
    const win = buildAlerts(user, data.results).find((a) => a.won && !done.has(a.id) && (Date.parse(a.date) || 0) > week);
    if (!win) return;
    const id = setTimeout(() => {
      if (busy() || askedToday()) return;
      set('qd_sp_wins', JSON.stringify([...done, win.id].slice(-60))); set('qd_sp_last', Date.now());
      setP({ kind: 'win', a: win });
    }, 7000);
    return () => clearTimeout(id);
  }, [user && user.uid, data && data.status]);

  // 2) loyal player, after 90 s of use
  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => {
      if (busy() || askedToday()) return;
      if ((Number(get('qd_opens')) || 0) < 5) return;
      if (Date.now() - (Number(get('qd_sp_app')) || 0) < 14 * DAY) return;
      set('qd_sp_app', Date.now()); set('qd_sp_last', Date.now());
      setP({ kind: 'app' });
    }, 90000);
    return () => clearTimeout(id);
  }, [user && user.uid]);

  if (!p) return null;
  const close = () => setP(null);
  const share = async () => {
    close();
    if (p.kind === 'win') {
      const g = (gameById(p.a.game) || {}).name || '';
      await shareText(`🎉 ${t('My number matched the {g} result on Q Spot 4D!', { g })}\n${p.a.sub}\n${t('Get daily 4D results, analysis and predictions free.')}`, { uid: user.uid, toast });
    } else {
      await shareText(t('Q Spot – Nehroopa 4D Predictions. Results, analysis and daily predictions.'), { uid: user.uid, toast });
    }
  };
  return (
    <div class="exit-wrap sp-wrap" role="dialog" aria-modal="true">
      <div class="exit-scrim" onClick={close} />
      <div class="exit-box">
        <div style="font-size:46px;line-height:1">{p.kind === 'win' ? '🎉' : '🤝'}</div>
        <div class="exit-title" style="text-align:center">{p.kind === 'win' ? t('Congratulations, you matched!') : t('Enjoying Q Spot?')}</div>
        <div class="meta" style="text-align:center;line-height:1.5">{p.kind === 'win' ? t('Share your win with friends and family on WhatsApp or Telegram.') : t('Share Q Spot with your friends. Each share brings you closer to the Promoter and Ambassador badges.')}</div>
        <button class="btn" style="margin-top:6px" onClick={share}>{p.kind === 'win' ? t('Share my win') : t('Share with friends')}</button>
        <button class="btn text" onClick={close}>{t('Not now')}</button>
      </div>
    </div>
  );
}
