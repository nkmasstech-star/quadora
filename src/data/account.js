// TEST account layer: accounts live only on this phone (localStorage).
// When Firebase Auth is connected, replace the bodies of these functions; the screens do not change.
const K_USERS = 'qd_users';
const K_SESSION = 'qd_session';

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

function hash(s) { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
const uid = () => `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export const currentUser = () => {
  const id = read(K_SESSION, null);
  if (!id) return null;
  return read(K_USERS, []).find((u) => u.uid === id) || null;
};
const publicUser = (u) => (u ? { uid: u.uid, name: u.name, email: u.email, avatar: u.avatar } : null);

export function signUp(name, email, pw) {
  const e = email.trim().toLowerCase();
  const users = read(K_USERS, []);
  if (users.some((u) => u.email === e)) return { error: 'This email is already registered. Please log in.' };
  const u = { uid: uid(), name: name.trim(), email: e, ph: hash(pw), avatar: Math.floor(Math.random() * 1000), created: Date.now() };
  users.push(u); write(K_USERS, users); write(K_SESSION, u.uid);
  return { user: publicUser(u) };
}

export function logIn(email, pw) {
  const e = email.trim().toLowerCase();
  const u = read(K_USERS, []).find((x) => x.email === e);
  if (!u || u.ph !== hash(pw)) return { error: 'Wrong email or password.' };
  write(K_SESSION, u.uid);
  return { user: publicUser(u) };
}

// Test stand-in for "Continue with Google": creates/uses a demo Google account.
export function googleDemo() {
  const e = 'google.demo@gmail.com';
  const users = read(K_USERS, []);
  let u = users.find((x) => x.email === e);
  if (!u) { u = { uid: uid(), name: 'Google Player', email: e, ph: '', avatar: 7, created: Date.now() }; users.push(u); write(K_USERS, users); }
  write(K_SESSION, u.uid);
  return { user: publicUser(u) };
}

export function logOut() { try { localStorage.removeItem(K_SESSION); } catch (e) { /* ignore */ } }

export function setAvatar(avatar) {
  const id = read(K_SESSION, null);
  const users = read(K_USERS, []);
  const u = users.find((x) => x.uid === id);
  if (u) { u.avatar = avatar; write(K_USERS, users); }
  return publicUser(u);
}

export function deleteAccount() {
  const id = read(K_SESSION, null);
  write(K_USERS, read(K_USERS, []).filter((x) => x.uid !== id));
  write('qd_posts', read('qd_posts', []).filter((p) => p.uid !== id));
  logOut();
}
