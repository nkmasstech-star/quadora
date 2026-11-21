// Account layer: the signed-in player's session is kept on this phone; the public profile (name, avatar) lives in Firestore via cloud.js.
import { MIN_AGE, NAME_EDITS, AVATAR_EDITS, NAME_MAX } from '../config.js';
import { saveProfile, updateProfile, cloudDeleteAccount } from './cloud.js';
import { webSignOut } from '../firebase.js';

const K_USERS = 'qd_users';
const K_SESSION = 'qd_session';

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
const uid = () => `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const pub = (u) => (u ? { uid: u.uid, name: u.name, email: u.email, avatar: u.avatar, nameEdits: u.nameEdits || 0, avatarEdits: u.avatarEdits || 0 } : null);
export const currentUser = () => {
  const id = read(K_SESSION, null);
  if (!id) return null;
  return pub(read(K_USERS, []).find((u) => u.uid === id));
};

export const ageFrom = (dobISO) => {
  if (!dobISO) return null;
  const b = new Date(dobISO); const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
  return a;
};

// Called after the real Google sign-in (profile.uid is the Firebase uid). Dev builds may pass a test profile.
export function googleSignIn(profile) {
  const p = profile;
  if (!p || !p.email) return { error: 'Google sign-in did not return an email. Please try again.' };
  const age = ageFrom(p.dob);
  if (age != null && age < MIN_AGE) return { error: 'You must be 18 or older to create an account.' };
  const e = p.email.toLowerCase();
  const users = read(K_USERS, []);
  let u = users.find((x) => x.email === e);
  if (u && p.uid && u.uid !== p.uid) { u.uid = p.uid; write(K_USERS, users); }
  if (!u) { u = { uid: p.uid || uid(), name: cleanName(p.name) || 'Player', email: e, avatar: Math.floor(Math.random() * 1000), nameEdits: 0, avatarEdits: 0, created: Date.now() }; users.push(u); write(K_USERS, users); }
  write(K_SESSION, u.uid);
  if (p.uid) saveProfile(pub(u)).catch(() => {});
  return { user: pub(u) };
}

export function logOut() { try { localStorage.removeItem(K_SESSION); } catch (e) { /* ignore */ } webSignOut(); }

// Text only: letters (any language) and spaces. No digits, emoji or symbols. Max 25 characters.
export function cleanName(s) { return String(s || '').replace(/[^\p{L}\p{M} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX); }
export const validName = (s) => /^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$/u.test(s) && s.length >= 2 && s.length <= NAME_MAX;

export function renameUser(name) {
  const id = read(K_SESSION, null);
  const users = read(K_USERS, []);
  const u = users.find((x) => x.uid === id);
  if (!u) return { error: 'Not signed in.' };
  if ((u.nameEdits || 0) >= NAME_EDITS) return { error: 'You have used all name changes.' };
  const n = name.trim();
  if (!validName(n)) return { error: 'Use letters only (2 to 25 characters). No numbers, emoji or symbols.' };
  u.name = n; u.nameEdits = (u.nameEdits || 0) + 1; write(K_USERS, users); updateProfile(u.uid, { name: n }).catch(() => {});
  return { user: pub(u) };
}

export function setAvatar(avatar) {
  const id = read(K_SESSION, null);
  const users = read(K_USERS, []);
  const u = users.find((x) => x.uid === id);
  if (!u) return { error: 'Not signed in.' };
  if (avatar === u.avatar) return { user: pub(u) };
  if ((u.avatarEdits || 0) >= AVATAR_EDITS) return { error: 'You have used all avatar changes.' };
  u.avatar = avatar; u.avatarEdits = (u.avatarEdits || 0) + 1; write(K_USERS, users); updateProfile(u.uid, { avatar }).catch(() => {});
  return { user: pub(u) };
}

export function deleteAccount() {
  const id = read(K_SESSION, null);
  if (id) cloudDeleteAccount(id).finally(webSignOut);
  write(K_USERS, read(K_USERS, []).filter((x) => x.uid !== id));
  ['qd_saved_', 'qd_picks_', 'qd_luckyn_', 'qd_follows_'].forEach((k) => { try { localStorage.removeItem(k + id); } catch (e) { /* ignore */ } });
  logOut();
}
