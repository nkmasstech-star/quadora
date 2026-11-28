// Comments and replies on posts: posts/{post}/comments/{id} = { uid, text, at, parent, reports }.
// parent '' = a comment; parent = comment id = a reply (replies to replies stay under the same comment, with @name).
// Limits (also in rules): 200 characters, 1 comment per 10 s, 30 a day, no comments in the first 24 h of a new
// account, muted players can't comment. 3 reports hide a comment; it goes to the admin moderation queue.
import { collection, doc, getDocs, onSnapshot, query, orderBy, limit, writeBatch, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { C } from './cloud.js';
import { checkComment } from './textguard.js';
import { addInbox } from './inbox.js';

export const COMMENT_HIDE_AT = 3;
const fire = () => window.dispatchEvent(new Event('qd-data'));
if (!C.comments) C.comments = {};

const subs = {};
export function watchComments(pid) {
  if (import.meta.env.DEV && location.search.includes('cdemo')) {
    C.users.u2 = C.users.u2 || { name: 'Kumar', avatar: 105 }; C.users.u3 = C.users.u3 || { name: 'Mei Ling', avatar: 212, refs: 11 };
    C.comments[pid] = [{ id: 'a', uid: 'u2', text: 'Nice pick! I also like 4821 for Saturday.', at: Date.now() - 3600e3, parent: '', reports: 0 }, { id: 'b', uid: 'u3', text: 'Same here, good luck both 🍀', at: Date.now() - 1800e3, parent: 'a', reports: 0 }, { id: 'c', uid: 'u2', text: '@Mei Ling thanks!', at: Date.now() - 600e3, parent: 'a', reports: 0 }];
    return () => {};
  }
  if (subs[pid]) return () => {};
  subs[pid] = onSnapshot(query(collection(db, 'posts', pid, 'comments'), orderBy('at', 'asc'), limit(200)), (s) => {
    C.comments[pid] = s.docs.map((d) => ({ id: d.id, ...d.data() })); fire();
  }, () => {});
  return () => { if (subs[pid]) subs[pid](); delete subs[pid]; };
}

// time left before this player may comment (new account / mute)
export function commentBlock(uid) {
  const u = C.users[uid] || {};
  if ((u.commentBanUntil || 0) > Date.now()) return { key: 'You are muted from comments until {d}.', d: new Date(u.commentBanUntil).toLocaleDateString() };
  if (u.created && Date.now() - u.created < 864e5) return { key: 'New accounts can comment 24 hours after joining.' };
  return null;
}

let lastText = []; let lastAt = 0;
export async function addComment(me, post, text, parent = null) {
  const err = checkComment(text);
  if (err) return { error: err };
  const b = commentBlock(me.uid);
  if (b) return { error: b.key, d: b.d };
  if (Date.now() - lastAt < 10000) return { error: 'Please wait a few seconds before commenting again.' };
  const clean = text.trim().replace(/\s+/g, ' ');
  if (lastText.includes(clean.toLowerCase())) return { error: 'You already posted this comment.' };
  const ref = doc(collection(db, 'posts', post.id, 'comments'));
  const day = Math.floor(Date.now() / 864e5);
  const u = C.users[me.uid] || {};
  const count = (u.cDay === day ? (u.cCount || 0) : 0) + 1;
  if (count > 30) return { error: 'You have reached 30 comments for today.' };
  const batch = writeBatch(db);
  batch.set(ref, { uid: me.uid, text: clean, at: Date.now(), parent: parent ? parent.id : '', reports: 0 });
  batch.update(doc(db, 'users', me.uid), { lastCommentAt: serverTimestamp(), cDay: day, cCount: count });
  batch.update(doc(db, 'posts', post.id), { comments: increment(1) });
  try { await batch.commit(); } catch (e) { return { error: 'Comment not sent. Wait a moment and try again.' }; }
  lastAt = Date.now(); lastText = [clean.toLowerCase(), ...lastText].slice(0, 5);
  if (C.users[me.uid]) { C.users[me.uid].cDay = day; C.users[me.uid].cCount = count; }
  post.comments = (post.comments || 0) + 1;
  // notify the post owner, and the person replied to
  if (post.uid !== me.uid) addInbox(post.uid, { type: 'comment', from: me.name, fromUid: me.uid, postId: `${post.id}${ref.id}` });
  if (parent && parent.uid !== me.uid && parent.uid !== post.uid) addInbox(parent.uid, { type: 'reply', from: me.name, fromUid: me.uid, postId: `${post.id}${ref.id}` });
  fire();
  return { ok: true };
}

export async function deleteComment(post, c) {
  const kids = (C.comments[post.id] || []).filter((x) => x.parent === c.id);
  const batch = writeBatch(db);
  [c, ...kids].forEach((x) => batch.delete(doc(db, 'posts', post.id, 'comments', x.id)));
  batch.update(doc(db, 'posts', post.id), { comments: increment(-1 - kids.length) });
  try { await batch.commit(); post.comments = Math.max(0, (post.comments || 0) - 1 - kids.length); fire(); return { ok: true }; } catch (e) { return { error: 'Could not delete. Check your internet.' }; }
}

export async function reportComment(me, post, c) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'posts', post.id, 'comments', c.id, 'reports', me.uid), { at: Date.now() });
  batch.update(doc(db, 'posts', post.id, 'comments', c.id), { reports: increment(1) });
  batch.set(doc(db, 'modq', `${post.id}_${c.id}`), { postId: post.id, cid: c.id, uid: c.uid, text: c.text, at: Date.now() });
  try { await batch.commit(); c.reports = (c.reports || 0) + 1; fire(); return { ok: true }; } catch (e) { return { error: 'You already reported this comment.' }; }
}

// comments grouped: [{ c, replies: [...] }], hiding blocked players and reported ones
export function threads(pid, hiddenUids = []) {
  const all = (C.comments[pid] || []).filter((x) => (x.reports || 0) < COMMENT_HIDE_AT && !hiddenUids.includes(x.uid));
  const tops = all.filter((x) => !x.parent);
  return tops.map((c) => ({ c, replies: all.filter((x) => x.parent === c.id) }));
}
export const canDeleteComment = (me, post, c) => !!me && (c.uid === me.uid || post.uid === me.uid || (auth.currentUser && auth.currentUser.email === 'nkmasstech@gmail.com'));
export { deleteDoc };
