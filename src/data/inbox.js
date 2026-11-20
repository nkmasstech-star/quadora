// TEST notification layer (this phone only). Likes, shares and follows from other players are written to the
// owner's inbox; with Firebase the same items arrive from Firestore and the OS push (FCM) wakes the phone.
// The screens do not change when that happens.
import { useState, useEffect } from 'preact/hooks';

const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
const KI = (uid) => `qd_inbox_${uid}`;
const KS = (uid) => `qd_seen_${uid}`;

export const inboxOf = (uid) => rd(KI(uid), []);

// type: like | share | follow ; from = display name of the person who acted
export function addInbox(toUid, { type, from, fromUid, postId }) {
  if (!toUid || fromUid === toUid) return;
  const list = inboxOf(toUid);
  if (list.some((x) => x.type === type && x.fromUid === fromUid && x.postId === postId)) return; // no spam: once per person per post
  const item = { id: `n${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, type, from, fromUid, postId: postId || null, at: Date.now(), read: false };
  wr(KI(toUid), [item, ...list].slice(0, 100));
  window.dispatchEvent(new CustomEvent('qd-inbox', { detail: { toUid, item } }));
}
export function markInboxRead(uid) {
  const l = inboxOf(uid);
  if (l.some((x) => !x.read)) wr(KI(uid), l.map((x) => ({ ...x, read: true })));
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
