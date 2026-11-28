// Tells players about app updates:
// 1) "New version available" — asks Google Play (in-app update API) on start. If a newer version is live,
//    a dialog offers Update now / Later. "Later" waits 1 day before asking again.
// 2) "What's new" — shown once, the first time the app opens after it was updated.
import { useEffect, useState } from 'preact/hooks';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { t } from './i18n.js';
import { Logo } from './icons.jsx';
import { PLAY_URL } from './config.js';

// keep this list short; it is shown once after an update
const WHATS_NEW = [
  'Live results: watch the numbers come in during the draw',
  'Groups: public or private, call challenges and see who wins',
  'Comments and replies on posts, plus a short text with your numbers',
  'Set your own profile photo from the gallery',
  'New badges: Leaders medals and invite ticks',
  'Swipe between Feeds, Groups, Following and Leaders',
];

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } };

export function UpdateHost() {
  const [mode, setMode] = useState(null); // null | 'update' | 'new'
  const [ver, setVer] = useState('');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let alive = true;
    (async () => {
      try {
        const info = await CapApp.getInfo();
        const cur = String(info.build || info.version || '');
        setVer(info.version || '');
        const seen = get('qd_seen_build');
        set('qd_seen_build', cur);
        // v1.1 never saved a build number, so an old player (has opened the app before) with no saved build = just updated
        const oldPlayer = !seen && (Number(get('qd_opens')) || 0) >= 2; // this open is already counted at splash
        if (oldPlayer || (seen && seen !== cur && Number(cur) > Number(seen))) { if (alive) setMode('new'); return; }
      } catch (e) { /* ignore */ }
      try {
        const { AppUpdate, AppUpdateAvailability } = await import('@capawesome/capacitor-app-update');
        const u = await AppUpdate.getAppUpdateInfo();
        if (u.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
        const later = Number(get('qd_upd_later')) || 0;
        if (Date.now() - later < 864e5) return;
        if (alive) setMode('update');
      } catch (e) { /* not installed from Play, or offline */ }
    })();
    return () => { alive = false; };
  }, []);

  const updateNow = async () => {
    setMode(null);
    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      const u = await AppUpdate.getAppUpdateInfo();
      if (u.immediateUpdateAllowed) { await AppUpdate.performImmediateUpdate(); return; }
      await AppUpdate.openAppStore();
    } catch (e) {
      try { window.open(PLAY_URL, '_system'); } catch (e2) { /* ignore */ }
    }
  };
  const later = () => { set('qd_upd_later', Date.now()); setMode(null); };

  if (!mode) return null;
  return (
    <div class="exit-wrap" role="dialog" aria-modal="true">
      <div class="exit-scrim" onClick={mode === 'new' ? () => setMode(null) : later} />
      {mode === 'update' ? (
        <div class="exit-box">
          <Logo size={52} />
          <div class="exit-title">{t('New version available')}</div>
          <div class="meta" style="text-align:center;line-height:1.5">{t('A new version of Q Spot is ready on Google Play with new features and fixes.')}</div>
          <div class="exit-btns">
            <button class="btn ghost" onClick={later}>{t('Later')}</button>
            <button class="btn" onClick={updateNow}>{t('Update now')}</button>
          </div>
        </div>
      ) : (
        <div class="exit-box">
          <Logo size={52} />
          <div class="exit-title">{t("What's new")}{ver ? ` · v${ver}` : ''}</div>
          <ul class="wn-list">
            {WHATS_NEW.map((x) => <li key={x}>{t(x)}</li>)}
          </ul>
          <button class="btn" style="margin-top:6px;width:100%" onClick={() => setMode(null)}>{t('Got it')}</button>
        </div>
      )}
    </div>
  );
}
