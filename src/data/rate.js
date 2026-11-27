// Rating + share helpers. Rating is asked only when the player chooses to EXIT the app (never while they are using it):
// - after the app has been opened at least 3 times
// - never again once they tapped "Rate now"
// - "Later" waits 7 days before asking again
import { Capacitor } from '@capacitor/core';
import { PLAY_URL } from '../config.js';
import { t } from '../i18n.js';

const K = { opens: 'qd_opens', rated: 'qd_rated', later: 'qd_rate_later' };
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } };

export function countOpen() { set(K.opens, (Number(get(K.opens)) || 0) + 1); }
export function shouldAskRating() {
  if (get(K.rated) === '1') return false;
  if ((Number(get(K.opens)) || 0) < 3) return false;
  const later = Number(get(K.later)) || 0;
  return Date.now() - later > 7 * 864e5;
}
export const rateLater = () => set(K.later, Date.now());

export function openStore() {
  const url = Capacitor.isNativePlatform() ? 'market://details?id=com.quadora.app' : PLAY_URL;
  try { window.open(url, '_system'); } catch (e) { location.href = PLAY_URL; }
}

// Google's in-app review sheet; if Google does not show it, open the Play Store page instead.
export async function rateNow() {
  set(K.rated, '1');
  if (!Capacitor.isNativePlatform()) { openStore(); return; }
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch (e) { openStore(); }
}

export async function shareApp(toast) {
  const text = `${t('Q Spot – Nehroopa 4D Predictions. Results, analysis and daily predictions.')} ${PLAY_URL}`;
  try {
    if (Capacitor.isNativePlatform()) { const { Share } = await import('@capacitor/share'); await Share.share({ title: 'Q Spot 4D', text, dialogTitle: t('Share the app') }); return; }
    if (navigator.share) { await navigator.share({ title: 'Q Spot 4D', text, url: PLAY_URL }); return; }
    await navigator.clipboard.writeText(text);
    if (toast) toast(t('Link copied'));
  } catch (e) { /* closed */ }
}
