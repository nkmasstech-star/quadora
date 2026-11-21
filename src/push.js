// Result push notifications (FCM topic "results"). Native app only; follows the Settings notification switch.
import { Capacitor } from '@capacitor/core';

const TOPIC = 'results';
let on = null; // last state we told Firebase

async function sync() {
  if (!Capacitor.isNativePlatform()) return;
  const want = localStorage.getItem('qd_notif') !== '0';
  if (want === on) return;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    if (want) {
      let p = await FirebaseMessaging.checkPermissions();
      if (p.receive !== 'granted') p = await FirebaseMessaging.requestPermissions();
      if (p.receive !== 'granted') return;
      await FirebaseMessaging.subscribeToTopic({ topic: TOPIC });
    } else {
      await FirebaseMessaging.unsubscribeFromTopic({ topic: TOPIC });
    }
    on = want;
  } catch (e) { /* push is optional; the app works without it */ }
}

// Tapping a push opens the page it is about (data.route, e.g. /game/magnum or /prediction/toto).
const ROUTE_OK = /^\/(game|prediction)\/[a-z]+$|^\/predictions$|^\/home$/;
async function listenTaps() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    await FirebaseMessaging.addListener('notificationActionPerformed', (e) => {
      const d = (e && e.notification && e.notification.data) || {};
      const r = typeof d.route === 'string' ? d.route : '';
      const go = () => { location.hash = ROUTE_OK.test(r) ? r : '/home'; };
      setTimeout(go, 600); // let the app finish opening first
    });
  } catch (e) { /* optional */ }
}

export function initPush() {
  listenTaps();
  setTimeout(sync, 4000); // after the splash, so the permission prompt does not fight it
  window.addEventListener('qd-notif', sync);
}
