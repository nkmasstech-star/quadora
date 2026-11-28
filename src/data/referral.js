// Invite links: every share carries the Play link with referrer=u=<inviter>[&g=<group code>].
// A new player who installs from that link and logs in counts once for the inviter (users/{inviter}.refs),
// and is offered to join the group. Blue-tick badges come from that count.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { doc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase.js';
import { C } from './cloud.js';
import { PLAY_URL } from '../config.js';

const Referrer = registerPlugin('Referrer');
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

export const refLink = (uid, gid) => (uid ? `${PLAY_URL}&referrer=${encodeURIComponent(`u=${uid}${gid ? `&g=${gid}` : ''}`)}` : PLAY_URL);

// read the install referrer once per install
export async function readReferrer() {
  if (get('qd_ref_read') === '1') return;
  if (import.meta.env.DEV) { const q = new URLSearchParams(location.search).get('ref'); if (q) set('qd_ref_pending', JSON.stringify(Object.fromEntries(new URLSearchParams(q)))); set('qd_ref_read', '1'); return; }
  if (!Capacitor.isNativePlatform()) return;
  try {
    const r = await Referrer.get();
    const p = Object.fromEntries(new URLSearchParams(String((r && r.referrer) || '')));
    if (p.u || p.g) set('qd_ref_pending', JSON.stringify({ u: p.u || '', g: (p.g || '').toUpperCase() }));
    set('qd_ref_read', '1');
  } catch (e) { /* try again next open */ }
}
export const pendingRef = () => { try { return JSON.parse(get('qd_ref_pending') || 'null'); } catch (e) { return null; } };
export function clearPendingGroup() { const p = pendingRef(); if (p) set('qd_ref_pending', JSON.stringify({ ...p, g: '' })); }

// credit the inviter once (rules allow each player to name one inviter, once)
export async function applyReferral(me) {
  const p = pendingRef();
  if (!p || !p.u || p.u === me.uid || get('qd_ref_done') === '1') return;
  const mine = C.users[me.uid];
  if (mine && mine.refBy) { set('qd_ref_done', '1'); return; }
  try {
    const b = writeBatch(db);
    b.update(doc(db, 'users', me.uid), { refBy: p.u });
    b.set(doc(db, 'users', p.u, 'refs', me.uid), { at: Date.now() });
    b.update(doc(db, 'users', p.u), { refs: increment(1) });
    await b.commit();
  } catch (e) { /* already counted or offline */ }
  set('qd_ref_done', '1');
}

// verified ticks: friends who joined from the player's invite link
export const TICKS = [
  { min: 10, kind: 'platinum', name: 'Platinum' },
  { min: 5, kind: 'gold', name: 'Gold' },
  { min: 3, kind: 'silver', name: 'Silver' },
];
export const refsOf = (uid) => (C.users[uid] && C.users[uid].refs) || 0;
export const tickOf = (n) => TICKS.find((x) => (n || 0) >= x.min) || null;
export const nextTick = (n) => [...TICKS].reverse().find((x) => (n || 0) < x.min) || null;
