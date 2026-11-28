// Live data (Firestore): posts, likes, follows, players and poll totals. Screens read this cache synchronously;
// every change from the server fires "qd-data" so the screens redraw.
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit, where, increment, writeBatch, documentId } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export const C = { posts: [], users: {}, likes: {}, following: {}, polls: {}, inbox: [], inboxUid: null, live: null, ready: false };
const fire = () => window.dispatchEvent(new Event('qd-data'));
let unsubs = []; let uidNow = null; let postsUnsub = null;
const asked = new Set();

export async function fetchUsers(ids) {
  const need = [...new Set(ids)].filter((i) => i && !C.users[i] && !asked.has(i));
  need.forEach((i) => asked.add(i));
  for (let k = 0; k < need.length; k += 30) {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', need.slice(k, k + 30))));
      snap.forEach((d) => { C.users[d.id] = { uid: d.id, ...d.data() }; });
    } catch (e) { /* offline: shown as Player */ }
  }
  fire();
}

// public feed: readable without sign-in
export function startPosts() {
  if (postsUnsub) return;
  postsUnsub = onSnapshot(query(collection(db, 'posts'), orderBy('at', 'desc'), limit(300)), (snap) => {
    C.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    C.ready = true; fire();
    fetchUsers(C.posts.map((p) => p.uid));
  }, () => { C.ready = true; fire(); });
}

export function startUser(uid) {
  if (uidNow === uid) return;
  stopUser(); uidNow = uid;
  fetchUsers([uid]); // own badge (shares) and follower count
  unsubs.push(onSnapshot(collection(db, 'users', uid, 'likes'), (s) => { C.likes = {}; s.forEach((d) => { C.likes[d.id] = 1; }); fire(); }, () => {}));
  // own inbox: likes / follows / shares other players sent; a new unread item after the first load pops the banner
  let first = true;
  unsubs.push(onSnapshot(query(collection(db, 'users', uid, 'inbox'), orderBy('at', 'desc'), limit(100)), (s) => {
    const old = new Set(C.inbox.map((x) => x.id));
    C.inbox = s.docs.map((d) => ({ id: d.id, ...d.data() })); C.inboxUid = uid;
    if (!first) C.inbox.filter((x) => !x.read && !old.has(x.id)).forEach((item) => window.dispatchEvent(new CustomEvent('qd-inbox', { detail: { toUid: uid, item } })));
    first = false; fire(); window.dispatchEvent(new Event('qd-badge'));
  }, () => {}));
  unsubs.push(onSnapshot(collection(db, 'users', uid, 'following'), (s) => { C.following = {}; s.forEach((d) => { C.following[d.id] = 1; }); fire(); fetchUsers(Object.keys(C.following)); }, () => {}));
}
export function stopUser() { unsubs.forEach((u) => u()); unsubs = []; uidNow = null; C.likes = {}; C.following = {}; C.inbox = []; C.inboxUid = null; }

export async function saveProfile(u) {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) { C.users[u.uid] = { uid: u.uid, ...snap.data() }; return C.users[u.uid]; }
  await setDoc(ref, { name: u.name, avatar: u.avatar, followers: 0, created: Date.now() });
  C.users[u.uid] = { uid: u.uid, name: u.name, avatar: u.avatar, followers: 0 };
  return C.users[u.uid];
}
export async function updateProfile(uid, patch) { C.users[uid] = { ...(C.users[uid] || { uid }), ...patch }; fire(); await updateDoc(doc(db, 'users', uid), patch); }

const ok = () => !!auth.currentUser;
const fail = (e) => { window.dispatchEvent(new CustomEvent('qd-cloud-error', { detail: String((e && e.code) || e) })); };

export function cloudCreate(post) {
  C.posts = [post, ...C.posts]; fire();
  const { id, ...rest } = post;
  setDoc(doc(db, 'posts', id), rest).catch(fail);
}
export function cloudEdit(id, picks) {
  const p = C.posts.find((x) => x.id === id); if (p) { p.picks = picks; p.edited = true; fire(); }
  updateDoc(doc(db, 'posts', id), { picks, edited: true }).catch(fail);
}
export function cloudDelete(id) { C.posts = C.posts.filter((p) => p.id !== id); fire(); deleteDoc(doc(db, 'posts', id)).catch(fail); }

export function cloudLike(uid, postId) {
  if (!ok()) return;
  const on = !C.likes[postId];
  const p = C.posts.find((x) => x.id === postId);
  if (on) C.likes[postId] = 1; else delete C.likes[postId];
  if (p) p.up = Math.max(0, (p.up || 0) + (on ? 1 : -1));
  fire();
  const b = writeBatch(db);
  const lr = doc(db, 'users', uid, 'likes', postId);
  if (on) b.set(lr, { at: Date.now() }); else b.delete(lr);
  b.update(doc(db, 'posts', postId), { up: increment(on ? 1 : -1) });
  b.commit().catch(fail);
}
export function cloudFollow(me, target) {
  if (!ok()) return;
  const on = !C.following[target];
  if (on) C.following[target] = 1; else delete C.following[target];
  const u = C.users[target]; if (u) u.followers = Math.max(0, (u.followers || 0) + (on ? 1 : -1));
  fire();
  const b = writeBatch(db);
  const fr = doc(db, 'users', me, 'following', target);
  if (on) b.set(fr, { at: Date.now() }); else b.delete(fr);
  b.update(doc(db, 'users', target), { followers: increment(on ? 1 : -1) });
  b.commit().catch(fail);
}
// one notification per person per post per type (the fixed id makes a repeat a no-op that the rules refuse)
export function cloudInboxAdd(toUid, { type, from, fromUid, postId }) {
  if (!ok() || auth.currentUser.uid !== fromUid) return;
  const id = `${type}_${fromUid}_${(postId || 'u').replace(/[^A-Za-z0-9]/g, '')}`;
  setDoc(doc(db, 'users', toUid, 'inbox', id), { type, from, fromUid, postId: postId || null, at: Date.now(), read: false }).catch(() => { /* already sent */ });
}
export function cloudInboxRead(uid) {
  if (!ok() || C.inboxUid !== uid) return;
  const unread = C.inbox.filter((x) => !x.read);
  if (!unread.length) return;
  unread.forEach((x) => { x.read = true; });
  const b = writeBatch(db);
  unread.slice(0, 400).forEach((x) => b.update(doc(db, 'users', uid, 'inbox', x.id), { read: true }));
  b.commit().catch(() => {});
}
// shares made by this player (for the Sharer / Promoter / Ambassador badges); at most 5 counted a day
export function cloudCountShare(uid) {
  if (!ok() || auth.currentUser.uid !== uid) return;
  let n = 0; const day = new Date().toISOString().slice(0, 10);
  try { const v = JSON.parse(localStorage.getItem('qd_share_day') || '{}'); n = v.day === day ? v.n : 0; if (n >= 5) return; localStorage.setItem('qd_share_day', JSON.stringify({ day, n: n + 1 })); } catch (e) { /* ignore */ }
  const u = C.users[uid] || (C.users[uid] = { uid }); u.shares = (u.shares || 0) + 1; fire();
  updateDoc(doc(db, 'users', uid), { shares: increment(1) }).catch(() => {});
}

export function cloudReport(uid, postId, reason) {
  if (!ok()) return;
  const p = C.posts.find((x) => x.id === postId); if (p) p.reports = (p.reports || 0) + 1; fire();
  const b = writeBatch(db);
  b.set(doc(db, 'posts', postId, 'reports', uid), { reason, at: Date.now() });
  b.update(doc(db, 'posts', postId), { reports: increment(1) });
  b.commit().catch(fail);
}
export async function cloudDeleteMine(uid) {
  try {
    const s = await getDocs(query(collection(db, 'posts'), where('uid', '==', uid)));
    await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
  } catch (e) { fail(e); }
}
export async function cloudDeleteAccount(uid) {
  await cloudDeleteMine(uid);
  try {
    const l = await getDocs(collection(db, 'users', uid, 'likes')); await Promise.all(l.docs.map((d) => deleteDoc(d.ref)));
    const f = await getDocs(collection(db, 'users', uid, 'following')); await Promise.all(f.docs.map((d) => deleteDoc(d.ref)));
    const n = await getDocs(collection(db, 'users', uid, 'inbox')); await Promise.all(n.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'users', uid));
    if (auth.currentUser && auth.currentUser.uid === uid) await auth.currentUser.delete().catch(() => {}); // remove the sign-in record too
  } catch (e) { fail(e); }
}

// ---- poll totals: polls/{game_date} holds counters c{position}_{digit}; votes/{uid} marks one vote per player ----
const watched = {};
export function watchPoll(key) {
  if (watched[key]) return;
  watched[key] = onSnapshot(doc(db, 'polls', key), (s) => { C.polls[key] = s.exists() ? s.data() : {}; fire(); }, () => { C.polls[key] = C.polls[key] || {}; });
}
export async function cloudVote(uid, key, digits) {
  const b = writeBatch(db);
  b.set(doc(db, 'polls', key, 'votes', uid), { digits, at: Date.now() });
  const inc = {}; digits.split('').forEach((d, i) => { inc[`c${i}_${d}`] = increment(1); });
  b.set(doc(db, 'polls', key), inc, { merge: true });
  await b.commit();
}
export async function cloudMyVote(uid, key) {
  try { const s = await getDoc(doc(db, 'polls', key, 'votes', uid)); return s.exists() ? s.data().digits : null; } catch (e) { return null; }
}

// ---- live results (pub/live, written by tools/live_results.mjs during the draws). Watched only while the Results
// screen is open and only in the draw window, to keep reads low. ----
let liveUnsub = null; let liveTimer = null; let liveUsers = 0;
const inWindow = () => { const d = new Date(); const hm = d.getUTCHours() * 100 + d.getUTCMinutes(); return hm >= 1015 && hm <= 1330; };
function liveCheck() {
  const want = liveUsers > 0 && inWindow();
  if (want && !liveUnsub) {
    liveUnsub = onSnapshot(doc(db, 'pub', 'live'), (s) => {
      try { C.live = s.exists() ? { at: Number(s.data().at) || 0, games: JSON.parse(s.data().json || '{}') } : null; } catch (e) { C.live = null; }
      fire();
    }, () => {});
  } else if (!want && liveUnsub) { liveUnsub(); liveUnsub = null; C.live = null; fire(); }
}
export function watchLive() {
  if (import.meta.env.DEV && location.search.includes('live')) { C.live = { at: Date.now(), games: { magnum: { date: '2099-01-01', first: '4821', second: '', third: '0937', special: ['1203', '5566', '9081', '3342', '7710'], consolation: ['2468', '1357'], n: 9, done: false } } }; return () => {}; }
  liveUsers += 1; liveCheck();
  if (!liveTimer) liveTimer = setInterval(liveCheck, 60000);
  return () => { liveUsers = Math.max(0, liveUsers - 1); liveCheck(); if (!liveUsers) { clearInterval(liveTimer); liveTimer = null; } };
}
