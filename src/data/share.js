// One share helper for every share button (post, challenge, rank, poll, win, app).
// Every share counts toward the player's badge: Sharer (3), Promoter (10), Ambassador (25). Badges only, no money.
import { Capacitor } from '@capacitor/core';
import { PLAY_URL } from '../config.js';
import { t } from '../i18n.js';
import { C, cloudCountShare } from './cloud.js';

export const BADGES = [
  { min: 25, icon: '👑', name: 'Ambassador' },
  { min: 10, icon: '🚀', name: 'Promoter' },
  { min: 3, icon: '📣', name: 'Sharer' },
];
export const badgeOf = (shares) => BADGES.find((b) => (shares || 0) >= b.min) || null;
export const sharesOf = (uid) => (C.users[uid] && C.users[uid].shares) || 0;
export const nextBadge = (shares) => [...BADGES].reverse().find((b) => (shares || 0) < b.min) || null;

// Opens the phone's share sheet (WhatsApp, Telegram, Facebook...). Falls back to copying the text.
export async function shareText(text, { uid, toast, withLink = true } = {}) {
  const full = withLink ? `${text}\n👉 ${PLAY_URL}` : text;
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: 'Q Spot 4D', text: full, dialogTitle: t('Share') });
    } else if (navigator.share) {
      await navigator.share({ title: 'Q Spot 4D', text: full });
    } else {
      await navigator.clipboard.writeText(full);
      if (toast) toast(t('Copied'));
    }
  } catch (e) { return false; } // closed without sharing
  if (uid) cloudCountShare(uid);
  return true;
}
