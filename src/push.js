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

export function initPush() {
  setTimeout(sync, 4000); // after the splash, so the permission prompt does not fight it
  window.addEventListener('qd-notif', sync);
}
