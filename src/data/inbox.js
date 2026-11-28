// Social notifications (likes, shares, follows, challenges). Each item is written by the player who acted into the
// owner's Firestore inbox users/{owner}/inbox/{type_fromUid_postId}; the owner's phone listens to it (see cloud.js).
// The id is fixed per person per post, so the same like/follow never notifies twice.
import { useState, useEffect } from 'preact/hooks';
import { C, cloudInboxAdd, cloudInboxRead } from './cloud.js';

const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
const KS = (uid) => `qd_seen_${uid}`;

// test items (Notifications > Test button) stay on this phone only
let testItems = [];
export const inboxOf = (uid) => (uid && C.inboxUid === uid ? [...testItems, ...C.inbox] : testItems).sort((a, b) => b.at - a.at);

// type: like | share | follow | challenge ; from = display name of the person who acted
export function addInbox(toUid, { type, from, fromUid, postId }) {
  if (!toUid || !fromUid || fromUid === toUid) return;
  cloudInboxAdd(toUid, { type, from: String(from || 'Player').slice(0, 25), fromUid, postId: postId || null });
}
export function addTestInbox(uid, { type, from, fromUid, postId }) {
  const item = { id: `t_${type}_${fromUid}_${postId}`, type, from, fromUid, postId, at: Date.now(), read: false };
  testItems = [item, ...testItems];
  window.dispatchEvent(new CustomEvent('qd-inbox', { detail: { toUid: uid, item } }));
}
export function markInboxRead(uid) {
  testItems = testItems.map((x) => ({ ...x, read: true }));
  cloudInboxRead(uid);
  window.dispatchEvent(new Event('qd-badge'));
}
export const seenOf = (uid) => rd(KS(uid), []);
export function markSeen(uid, ids) {
  const s = new Set(seenOf(uid)); ids.forEach((i) => s.add(i));
  wr(KS(uid), [...s].slice(-400));
  window.dispatchEvent(new Event('qd-badge'));
}

export const notifOnNow = () => { try { return localStorage.getItem('qd_notif') !== '0'; } catch (e) { return true; } };

// red dot on the bell: unread social items + result alerts / announcements not yet opened
let badgeN = 0;
export function setBadge(n) { if (n !== badgeN) { badgeN = n; window.dispatchEvent(new Event('qd-badge')); } }
export function useBadge() {
  const [, tick] = useState(0);
  useEffect(() => { const h = () => tick((x) => x + 1); window.addEventListener('qd-badge', h); window.addEventListener('qd-notif', h); return () => { window.removeEventListener('qd-badge', h); window.removeEventListener('qd-notif', h); }; }, []);
  return notifOnNow() && badgeN > 0 ? badgeN : 0;
}
