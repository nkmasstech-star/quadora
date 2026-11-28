// One share helper for every share button (post, rank, poll, win, group, app).
// The Play link carries the player's invite id, so friends who install from it count toward the blue tick.
import { Capacitor } from '@capacitor/core';
import { t } from '../i18n.js';
import { refLink } from './referral.js';

// Opens the phone's share sheet (WhatsApp, Telegram, Facebook...). Falls back to copying the text.
export async function shareText(text, { uid, gid, toast, withLink = true } = {}) {
  const full = withLink ? `${text}\n👉 ${refLink(uid, gid)}` : text;
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
  return true;
}
