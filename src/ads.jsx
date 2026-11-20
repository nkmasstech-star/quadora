// TEST ads layer: placeholders only. At release, the bodies of AdBanner / requestInterstitial are replaced with AdMob
// (test ad IDs first, then the real ones); every screen keeps calling the same functions.
import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { t } from './i18n.js';
import { AD_INTERSTITIAL_GAP_SEC, AD_BANNER_REFRESH_SEC, AD_PREDICTION_GAMES, AD_TEST, ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID } from './config.js';
import { Capacitor } from '@capacitor/core';

const NATIVE = Capacitor.isNativePlatform();
let admob = null;
let ready = null;
// Real AdMob (Android app only). In the browser the placeholder ads below are used.
function initAdMob() {
  if (!NATIVE) return Promise.resolve(false);
  if (!ready) {
    ready = import('@capacitor-community/admob').then(async (m) => {
      admob = m;
      await m.AdMob.initialize({ initializeForTesting: AD_TEST });
      return true;
    }).catch(() => false);
  }
  return ready;
}
import { go } from './App.jsx';

const DUMMY = [
  ['Sample ad', 'Your ad could be here'],
  ['Sample ad', 'Try our new app today'],
  ['Sample ad', 'Fresh offers every day'],
  ['Sample ad', 'Learn something new'],
];

// Inline banner (shown inside the page, never floating, never next to buttons). Refreshes while the user stays.
export function AdBanner({ native }) {
  if (NATIVE) return null; // the app shows one real bottom banner instead (see InterstitialHost)
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), AD_BANNER_REFRESH_SEC * 1000);
    return () => clearInterval(id);
  }, []);
  const d = DUMMY[n % DUMMY.length];
  return (
    <div class={native ? 'adslot native' : 'adslot'} role="complementary" aria-label={t('Ad (test)')}>
      <span class="adtag">{t('Ad (test)')}</span>
      <div class="adbody"><b>{t(d[0])}</b><small>{t(d[1])}</small></div>
    </div>
  );
}

// Full-screen ad: only when the user taps a prediction card, at most once per AD_INTERSTITIAL_GAP_SEC.
let lastShown = 0;
let listener = null;
export function requestInterstitial(onDone) {
  const now = Date.now();
  if (!listener || now - lastShown < AD_INTERSTITIAL_GAP_SEC * 1000) { onDone(); return; }
  lastShown = now;
  listener(onDone);
}
export function goWithAd(path, gameId) {
  if (AD_PREDICTION_GAMES.includes(gameId)) requestInterstitial(() => go(path));
  else go(path);
}

export function InterstitialHost() {
  const [cb, setCb] = useState(null);
  const [left, setLeft] = useState(3);
  useEffect(() => {
    if (NATIVE) {
      // real ads: full-screen ad on request (the banner is handled by BannerHost, only on result pages)
      listener = (done) => {
        initAdMob().then(async (ok) => {
          if (!ok) { done(); return; }
          let finished = false;
          const fin = () => { if (!finished) { finished = true; done(); } };
          try {
            const h = await admob.AdMob.addListener(admob.InterstitialAdPluginEvents.Dismissed, () => { h.remove(); fin(); });
            const f = await admob.AdMob.addListener(admob.InterstitialAdPluginEvents.FailedToShow, () => { f.remove(); fin(); });
            await admob.AdMob.prepareInterstitial({ adId: ADMOB_INTERSTITIAL_ID, isTesting: AD_TEST });
            await admob.AdMob.showInterstitial();
          } catch (e) { fin(); }
        });
      };
      return () => { listener = null; };
    }
    listener = (done) => { setLeft(3); setCb(() => done); };
    return () => { listener = null; };
  }, []);
  useEffect(() => {
    if (!cb || left <= 0) return undefined;
    const id = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [cb, left]);
  if (!cb) return null;
  const close = () => { const f = cb; setCb(null); f(); };
  return createPortal(
    <div class="ad-wrap" role="dialog" aria-modal="true" aria-label={t('Ad (test)')}>
      <div class="ad-box">
        <div class="ad-tag">{t('Ad (test)')}</div>
        <div class="ad-body">{t('A short ad will play here.')}</div>
        <button class="btn" disabled={left > 0} onClick={close}>{left > 0 ? t('Wait {n}s', { n: left }) : t('Continue')}</button>
      </div>
    </div>,
    document.body,
  );
}

// Native banner: only on a game's Results page (never Singapore), never on other screens. No bottom nav there, so nothing overlaps.
export function BannerHost({ path }) {
  const m = /^\/game\/([^/?#]+)/.exec(path || '');
  const want = !!m && m[1] !== 'singapore';
  useEffect(() => {
    if (!NATIVE) return undefined;
    let dead = false;
    initAdMob().then(async (ok) => {
      if (!ok || dead) return;
      try {
        if (want) await admob.AdMob.showBanner({ adId: ADMOB_BANNER_ID, adSize: admob.BannerAdSize.ADAPTIVE_BANNER, position: admob.BannerAdPosition.BOTTOM_CENTER, margin: 0, isTesting: AD_TEST });
        else await admob.AdMob.removeBanner();
      } catch (e) { /* ignore */ }
    });
    return () => { dead = true; };
  }, [want]);
  return null;
}
