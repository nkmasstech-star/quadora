// Groups: a player creates a group (becomes its admin), shares the 6-letter code, friends join with it.
// The group shows only its members' posts; any member can call a challenge for a draw, and after the official
// result the members' picks for that draw are ranked. Removing a member removes their posts from the group too
// (the group always reads posts of the current members only). The doc id IS the join code.
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, limit, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { C, fetchUsers } from './cloud.js';
import { addInbox } from './inbox.js';
import { targetDraw } from './rules.js';
import { drawsOf } from './store.js';
import { matchSets } from './community.js';

export const GROUP_MAX = 50; // members per group
export const GROUP_OWN_MAX = 5; // groups one player can create
export const GROUP_ICONS = ['🐉', '🦁', '🐯', '🦅', '🔥', '⭐', '💎', '🎯', '🏆', '🍀', '🎲', '👑', '🚀', '⚡', '🌙', '☀️', '🌸', '🪙', '🧧', '🐲', '🦚', '🐘', '🎉', '💰'];
const fire = () => window.dispatchEvent(new Event('qd-data'));
const err = (e) => window.dispatchEvent(new CustomEvent('qd-cloud-error', { detail: String((e && e.code) || e) }));

if (!C.groups) { C.groups = []; C.gposts = {}; C.gchal = {}; }
if (!C.pubGroups) { C.pubGroups = []; C.gfollow = {}; }

// my groups (live), started after sign-in from cloud.js startUser
let gUnsub = null; let fUnsub = null;
export function startGroups(uid) {
  stopGroups();
  if (import.meta.env.DEV && location.search.includes('gdemo')) {
    C.pubGroups = [{ id: 'PUB777', name: 'Magnum Masters', icon: 8, type: 'public', owner: 'u3', members: ['u3', 'u2', 'u4'], created: 3 }, { id: 'PUB888', name: 'Toto Kings', icon: 11, type: 'public', owner: 'u2', members: ['u2'], created: 2 }];
    C.groups = [{ id: 'ABC123', name: 'Lucky Friends', icon: 0, type: 'private', owner: uid, members: [uid, 'u2', 'u3', 'u4'], created: 1 }];
    C.users.u2 = { name: 'Kumar', avatar: 105, refs: 4 }; C.users.u3 = { name: 'Mei Ling', avatar: 212, refs: 11 }; window.__medalDemo = { u2: 'diamond', [uid]: 'gold' }; C.users.u4 = { name: 'Aisha', avatar: 330, refs: 1 };
    C.users[uid] = { ...(C.users[uid] || {}), refs: 6 };
    C.gchal.ABC123 = [{ id: 'magnum_2026-12-02', by: 'u2', byName: 'Kumar', game: 'magnum', forDate: '2026-12-02', at: 2 }, { id: 'magnum_2026-11-25', by: uid, byName: 'Nehru', game: 'magnum', forDate: '2026-11-25', at: 1 }];
    const mk = (u, sets, f, d) => ({ id: `d${u}${d}`, uid: u, day: d, at: Date.parse(d) - 5e6, edited: false, up: 2, reports: 0, picks: [{ game: 'magnum', format: f, sets, forDate: d }] });
    C.gposts.ABC123 = [{ ...mk('u2', ['2681', '1111'], 'iBox', '2026-11-25'), text: 'Dreamt of my grandfather last night, his old car plate. Going iBox this time! 🍀' }, mk(uid, ['5200', '7777'], 'Straight', '2026-11-25'), mk('u3', ['0243'], 'Straight', '2026-11-25'), mk('u4', ['1234'], 'Straight', '2026-11-25'), mk('u3', ['4444'], 'Straight', '2026-12-02')];
    return;
  }
  // public groups (discover list) and the public groups I follow
  getDocs(query(collection(db, 'groups'), where('type', '==', 'public'), limit(100))).then((s) => {
    C.pubGroups = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.members.length - a.members.length || b.created - a.created);
    fire();
  }).catch(() => {});
  if (fUnsub) fUnsub();
  fUnsub = onSnapshot(collection(db, 'users', uid, 'gfollow'), (s) => { C.gfollow = {}; s.forEach((d) => { C.gfollow[d.id] = true; }); fire(); }, () => {});
  gUnsub = onSnapshot(query(collection(db, 'groups'), where('members', 'array-contains', uid)), (s) => {
    C.groups = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.created - a.created);
    fetchUsers(C.groups.flatMap((g) => g.members));
    fire();
  }, () => {});
}
export function stopGroups() { if (gUnsub) gUnsub(); if (fUnsub) fUnsub(); gUnsub = null; fUnsub = null; C.groups = []; C.gfollow = {}; }
export const groupById = (id) => C.groups.find((g) => g.id === id) || C.pubGroups.find((g) => g.id === id) || null;
export const isPublic = (g) => g && g.type === 'public';
export const isMember = (g, uid) => !!g && g.members.includes(uid);
export async function openGroup(id) {
  if (groupById(id)) return groupById(id);
  const g = await findGroup(id);
  if (g && isPublic(g) && !C.pubGroups.some((x) => x.id === g.id)) { C.pubGroups.push(g); fire(); }
  return g;
}
// follow a public group: its posts show in the Following tab
export function toggleGroupFollow(uid, g) {
  const ref = doc(db, 'users', uid, 'gfollow', g.id);
  if (C.gfollow[g.id]) { delete C.gfollow[g.id]; deleteDoc(ref).catch(err); } else { C.gfollow[g.id] = true; setDoc(ref, { at: Date.now() }).catch(err); }
  fire();
}

const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');

export async function createGroup(me, name, icon, type = 'private') {
  if (C.groups.filter((g) => g.owner === me.uid).length >= GROUP_OWN_MAX) return { error: 'You can create up to 5 groups.' };
  for (let i = 0; i < 4; i += 1) {
    const code = newCode();
    const ref = doc(db, 'groups', code);
    try {
      if ((await getDoc(ref)).exists()) continue;
    } catch (e) { /* a code nobody uses cannot be read yet: fine */ }
    try {
      const g = { name: name.trim(), icon, type, owner: me.uid, members: [me.uid], code, created: Date.now() };
      await setDoc(ref, g);
      if (type === 'public') { C.pubGroups.unshift({ id: code, ...g }); fire(); }
      return { id: code };
    } catch (e) { err(e); return { error: 'Could not create the group. Check your internet.' }; }
  }
  return { error: 'Could not create the group. Try again.' };
}

export async function findGroup(code) {
  const id = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (id.length !== 6) return null;
  try { const s = await getDoc(doc(db, 'groups', id)); return s.exists() ? { id: s.id, ...s.data() } : null; } catch (e) { return null; }
}
export async function joinGroup(me, code) {
  const g = await findGroup(code);
  if (!g) return { error: 'No group found with this code.' };
  if (g.members.includes(me.uid)) return { id: g.id };
  if (g.members.length >= GROUP_MAX) return { error: 'This group is full (50 members).' };
  try {
    await updateDoc(doc(db, 'groups', g.id), { members: arrayUnion(me.uid) });
    const pg = C.pubGroups.find((x) => x.id === g.id); if (pg && !pg.members.includes(me.uid)) pg.members = [...pg.members, me.uid];
    return { id: g.id };
  } catch (e) { err(e); return { error: 'Could not join. Check your internet.' }; }
}
export function leaveGroup(me, g) {
  const pg = C.pubGroups.find((x) => x.id === g.id); if (pg) pg.members = pg.members.filter((u) => u !== me.uid);
  return updateDoc(doc(db, 'groups', g.id), { members: arrayRemove(me.uid) }).catch(err);
}
export const renameGroup = (g, name) => updateDoc(doc(db, 'groups', g.id), { name: name.trim() }).catch(err);
export const setGroupIcon = (g, icon) => updateDoc(doc(db, 'groups', g.id), { icon }).catch(err);
export function addMember(me, g, uid) {
  if (g.members.includes(uid) || g.members.length >= GROUP_MAX) return;
  updateDoc(doc(db, 'groups', g.id), { members: arrayUnion(uid) }).then(() => addInbox(uid, { type: 'group', from: me.name, fromUid: me.uid, postId: g.id })).catch(err);
}
export const removeMember = (g, uid) => (isPublic(g) ? Promise.resolve() : updateDoc(doc(db, 'groups', g.id), { members: arrayRemove(uid) }).catch(err));
export async function deleteGroup(g) {
  try {
    const s = await getDocs(collection(db, 'groups', g.id, 'challenges'));
    await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'groups', g.id));
    C.pubGroups = C.pubGroups.filter((x) => x.id !== g.id); fire();
  } catch (e) { err(e); }
}

// ---- members' posts (read straight from Firestore, so older posts beyond the main feed are included) ----
export async function loadGroupPosts(g) {
  if (import.meta.env.DEV && location.search.includes('gdemo')) return;
  const out = [];
  if (isPublic(g)) {
    try { const s = await getDocs(query(collection(db, 'posts'), where('gid', '==', g.id), limit(300))); s.forEach((d) => out.push({ id: d.id, ...d.data() })); } catch (e) { /* offline */ }
  } else {
    for (let k = 0; k < g.members.length; k += 30) {
      try {
        const s = await getDocs(query(collection(db, 'posts'), where('uid', 'in', g.members.slice(k, k + 30)), limit(300)));
        s.forEach((d) => out.push({ id: d.id, ...d.data() }));
      } catch (e) { /* offline */ }
    }
  }
  C.gposts[g.id] = out.sort((a, b) => b.at - a.at);
  fire();
}
// public group: posts made in it; private group: the members' main-feed posts
export const groupPosts = (g) => {
  const src = C.gposts[g.id] || C.posts;
  const seen = new Set();
  const extra = C.posts.filter((p) => (isPublic(g) ? p.gid === g.id : !p.gid && g.members.includes(p.uid)));
  return [...extra, ...src].filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return isPublic(g) ? p.gid === g.id : !p.gid && g.members.includes(p.uid); }).sort((a, b) => b.at - a.at);
};

// ---- challenges: one per game per draw in a group ----
const chUnsub = {};
export function watchChallenges(gid) {
  if (import.meta.env.DEV && location.search.includes('gdemo')) return () => {};
  if (chUnsub[gid]) return () => {};
  chUnsub[gid] = onSnapshot(collection(db, 'groups', gid, 'challenges'), (s) => {
    C.gchal[gid] = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.at - a.at); fire();
  }, () => {});
  return () => { if (chUnsub[gid]) chUnsub[gid](); delete chUnsub[gid]; };
}
export async function callChallenge(me, g, game) {
  const forDate = targetDraw(game);
  const id = `${game}_${forDate}`;
  if ((C.gchal[g.id] || []).some((c) => c.id === id)) return { error: 'A challenge for this draw is already on.' };
  try {
    await setDoc(doc(db, 'groups', g.id, 'challenges', id), { by: me.uid, byName: me.name, game, forDate, at: Date.now() });
  } catch (e) { return { error: 'A challenge for this draw is already on.' }; }
  g.members.filter((u) => u !== me.uid).forEach((u) => addInbox(u, { type: 'challenge', from: me.name, fromUid: me.uid, postId: `${g.id}${game}${forDate.replace(/-/g, '')}` }));
  return { ok: true, forDate };
}
export const deleteChallenge = (g, c) => deleteDoc(doc(db, 'groups', g.id, 'challenges', c.id)).catch(err);

// ---- ranking: members' picks for one game + draw, after the official result ----
const PRIZE_RANK = { '1st': 1, '2nd': 2, '3rd': 3, Special: 4, Consolation: 5 };
export function rankDraw(g, posts, game, date, results) {
  const draw = drawsOf(results, game).find((d) => d.date === date);
  const rows = [];
  posts.forEach((p) => p.picks.forEach((k) => {
    if (k.game !== game || k.forDate !== date || !g.members.includes(p.uid)) return;
    const hits = draw ? matchSets(k.sets, k.format, draw) : [];
    const best = hits.length ? Math.min(...hits.map((h) => PRIZE_RANK[h.prize] || 9)) : 99;
    rows.push({ uid: p.uid, post: p, pick: k, hits, best });
  }));
  rows.sort((a, b) => a.best - b.best || b.hits.length - a.hits.length || a.post.at - b.post.at);
  return { resolved: !!draw, rows };
}
// recent draws the members played (newest first)
export function playedDraws(g, posts) {
  const seen = new Map();
  posts.forEach((p) => { if (g.members.includes(p.uid)) p.picks.forEach((k) => { const key = `${k.game}|${k.forDate}`; if (!seen.has(key)) seen.set(key, { game: k.game, date: k.forDate }); }); });
  return [...seen.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
export const isOwner = (g) => !!auth.currentUser && g.owner === auth.currentUser.uid;
