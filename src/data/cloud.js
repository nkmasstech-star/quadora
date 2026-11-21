// Live data (Firestore): posts, likes, follows, players and poll totals. Screens read this cache synchronously;
// every change from the server fires "qd-data" so the screens redraw.
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit, where, increment, writeBatch, documentId } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export const C = { posts: [], users: {}, likes: {}, following: {}, polls: {}, ready: false };
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
  postsUnsub = onSnapshot(query(collection(db, 'posts'), orderBy('at', 'desc'), limit(150)), (snap) => {
    C.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    C.ready = true; fire();
    fetchUsers(C.posts.map((p) => p.uid));
  }, () => { C.ready = true; fire(); });
}

export function startUser(uid) {
  if (uidNow === uid) return;
  stopUser(); uidNow = uid;
  unsubs.push(onSnapshot(collection(db, 'users', uid, 'likes'), (s) => { C.likes = {}; s.forEach((d) => { C.likes[d.id] = 1; }); fire(); }, () => {}));
  unsubs.push(onSnapshot(collection(db, 'users', uid, 'following'), (s) => { C.following = {}; s.forEach((d) => { C.following[d.id] = 1; }); fire(); fetchUsers(Object.keys(C.following)); }, () => {}));
}
export function stopUser() { unsubs.forEach((u) => u()); unsubs = []; uidNow = null; C.likes = {}; C.following = {}; }

export async function saveProfile(u) {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) { C.users[u.uid] = { uid: u.uid, ...snap.data() }; return; }
  await setDoc(ref, { name: u.name, avatar: u.avatar, followers: 0, created: Date.now() });
  C.users[u.uid] = { uid: u.uid, name: u.name, avatar: u.avatar, followers: 0 };
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
    await deleteDoc(doc(db, 'users', uid));
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
