// TEST community layer: everything lives on this phone (localStorage) plus generated sample players.
// When Firebase (Firestore) is connected, replace the load/save functions; screens keep working.
import { GAMES } from './games.js';
import { drawsOf, prizeEntries } from './store.js';
import { FOLLOW_MIN_DRAWS } from '../config.js';
import { targetDraw as targetDrawId, cutoffMs } from './rules.js';

export const FORMATS = ['Straight', 'iBox', 'Multi'];
export const MAX_GAMES = 2;
export const MAX_SETS = 4;

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

// ---------- dates (the phone's own calendar day) ----------
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const targetDraw = (g) => targetDrawId(g.id);

// ---------- sample players (test only) ----------
export const SEED_USERS = [
  { uid: 's-kumar', name: 'Kumar', avatar: 5, followers: 128 },
  { uid: 's-meiling', name: 'Mei Ling', avatar: 112, followers: 94 },
  { uid: 's-sok', name: 'Sok', avatar: 845, followers: 61 },
  { uid: 's-ahmad', name: 'Ahmad', avatar: 233, followers: 77 },
  { uid: 's-lakshmi', name: 'Lakshmi', avatar: 561, followers: 43 },
];

function rng(seed) { let a = 0; for (let i = 0; i < seed.length; i += 1) a = (a * 31 + seed.charCodeAt(i)) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const num4 = (r) => String(Math.floor(r() * 10000)).padStart(4, '0');

function seedPosts(results) {
  const out = [];
  const gids = ['magnum', 'toto', 'damacai', 'singapore', 'gdlotto'];
  SEED_USERS.forEach((u, ui) => {
    const r = rng(u.uid);
    for (let k = 0; k < 6; k += 1) {
      const gid = gids[(ui + k) % gids.length];
      const draws = drawsOf(results, gid);
      const d = draws[k + 1] || draws[draws.length - 1];
      if (!d) continue;
      const fmt = FORMATS[Math.floor(r() * 3)];
      const sets = [num4(r), num4(r), num4(r), num4(r)];
      if (r() < 0.4) { const pe = prizeEntries(d); const hit = pe[Math.floor(r() * pe.length)].number; sets[0] = fmt === 'Straight' ? hit : hit.split('').reverse().join(''); }
      out.push({ id: `seed-${u.uid}-${k}`, uid: u.uid, day: addDays(d.date, -1), at: new Date(`${addDays(d.date, -1)}T05:00:00Z`).getTime(), edited: false, picks: [{ game: gid, format: fmt, sets, forDate: d.date }], up: 6 + Math.floor(r() * 30), down: Math.floor(r() * 14), seed: true });
    }
    const g = GAMES[(ui * 2) % GAMES.length];
    const tr = rng(u.uid + 'today');
    const g2 = GAMES[(ui * 2 + 1) % GAMES.length];
    out.push({ id: `seed-${u.uid}-today`, uid: u.uid, day: today(), at: Date.now() - (ui + 1) * 3600e3, edited: false, picks: [{ game: g.id, format: FORMATS[ui % 3], sets: [num4(tr), num4(tr), num4(tr)], forDate: targetDraw(g) }, { game: g2.id, format: FORMATS[(ui + 1) % 3], sets: [num4(tr), num4(tr)], forDate: targetDraw(g2) }], up: 3 + ui * 2, down: ui, seed: true });
  });
  return out;
}

// ---------- posts ----------
export const myPosts = () => read('qd_posts', []);
export function allPosts(results) {
  return [...myPosts(), ...seedPosts(results)].sort((a, b) => b.at - a.at);
}
export function userPosts(uid, results) { return allPosts(results).filter((p) => p.uid === uid); }
export const postedToday = (uid) => myPosts().some((p) => p.uid === uid && p.day === today());
// Edit/delete is open until 2 hours before the earliest draw in the post starts.
export const cutoffOf = (p) => Math.min(...p.picks.map((k) => cutoffMs(k.game, k.forDate)));
export const canEdit = (p, uid) => p.uid === uid && !p.seed && !p.edited && Date.now() < cutoffOf(p);
export const canDelete = (p, uid) => p.uid === uid && !p.seed && Date.now() < cutoffOf(p);

export function validPicks(picks) {
  if (!picks.length || picks.length > MAX_GAMES) return 'Choose 1 or 2 games.';
  for (const k of picks) {
    if (!k.sets.length || k.sets.length > MAX_SETS) return 'Add 1 to 4 numbers for each game.';
    if (k.sets.some((s) => !/^\d{4}$/.test(s))) return 'Every number needs exactly 4 digits.';
    if (new Set(k.sets).size !== k.sets.length) return 'Remove repeated numbers.';
  }
  return '';
}

export function createPost(uid, picks) {
  const posts = myPosts();
  const p = { id: `p${Date.now().toString(36)}`, uid, day: today(), at: Date.now(), edited: false, picks: picks.map((k) => ({ ...k, forDate: targetDraw(GAMES.find((g) => g.id === k.game)) })), up: 0, down: 0 };
  posts.unshift(p); write('qd_posts', posts);
  return p;
}
export function editPost(id, picks) {
  const posts = myPosts();
  const p = posts.find((x) => x.id === id);
  if (!p) return;
  p.picks = picks.map((k) => ({ ...k, forDate: targetDraw(GAMES.find((g) => g.id === k.game)) }));
  p.edited = true; write('qd_posts', posts);
}
export function deletePost(id) { write('qd_posts', myPosts().filter((p) => p.id !== id)); }

// ---------- likes, saves & follows ----------
export const myLikes = () => read('qd_likes', {});
export function toggleLike(postId) { const m = myLikes(); if (m[postId]) delete m[postId]; else m[postId] = 1; write('qd_likes', m); }
export const likeCount = (p) => (p.up || 0) + (myLikes()[p.id] ? 1 : 0);
export const savedIds = (uid) => read(`qd_saved_${uid}`, []);
export function toggleSave(uid, postId) { const l = savedIds(uid); const i = l.indexOf(postId); if (i >= 0) l.splice(i, 1); else l.unshift(postId); write(`qd_saved_${uid}`, l); }
export const savedPosts = (uid, results) => { const ids = savedIds(uid); const all = allPosts(results); return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean); };

// private picks (saved without posting) and saved lucky numbers
export const myPicks = (uid) => read(`qd_picks_${uid}`, []);
export function addPick(uid, picks) { const l = myPicks(uid); l.unshift({ id: `k${Date.now().toString(36)}`, at: Date.now(), picks: picks.map((k) => ({ ...k, forDate: targetDrawId(k.game) })) }); write(`qd_picks_${uid}`, l.slice(0, 100)); }
export function delPick(uid, id) { write(`qd_picks_${uid}`, myPicks(uid).filter((x) => x.id !== id)); }
export const myLucky = (uid) => read(`qd_luckyn_${uid}`, []);
export function addLucky(uid, n, game, format) { const l = myLucky(uid); l.unshift({ id: `l${Date.now().toString(36)}`, at: Date.now(), n, game, format, forDate: targetDrawId(game) }); write(`qd_luckyn_${uid}`, l.slice(0, 100)); }
export function delLucky(uid, id) { write(`qd_luckyn_${uid}`, myLucky(uid).filter((x) => x.id !== id)); }
export const followingOf = (uid) => read(`qd_follows_${uid}`, []);
export const followingCount = (uid) => followingOf(uid).length;
export function toggleFollow(me, target) {
  const f = followingOf(me);
  const i = f.indexOf(target);
  if (i >= 0) f.splice(i, 1); else f.push(target);
  write(`qd_follows_${me}`, f);
}
export function followersOf(uid, me) {
  const s = SEED_USERS.find((x) => x.uid === uid);
  return (s ? s.followers : 0) + (me && followingOf(me).includes(uid) ? 1 : 0);
}

// ---------- winning % ----------
const norm = (s) => s.split('').sort().join('');
// Which of the given 4-digit numbers matched this draw, using the chosen format (Straight = exact, iBox/Multi = any digit order).
export function matchSets(sets, format, draw) {
  const hits = [];
  prizeEntries(draw).forEach((e) => sets.forEach((s) => { if (format === 'Straight' ? e.number === s : norm(e.number) === norm(s)) hits.push({ set: s, prize: e.prize }); }));
  return hits;
}
export function evalEntry(game, format, sets, forDate, results) {
  const d = drawsOf(results, game).find((x) => x.date === forDate);
  if (!d) return { resolved: false, won: false, hits: [] };
  const hits = matchSets(sets, format, d);
  return { resolved: true, won: hits.length > 0, hits };
}
const pickWins = (pick, draw) => matchSets(pick.sets, pick.format, draw).length > 0;
export function evalPost(post, results) {
  let resolved = false; let won = false;
  post.picks.forEach((k) => {
    const d = drawsOf(results, k.game).find((x) => x.date === k.forDate);
    if (d) { resolved = true; if (pickWins(k, d)) won = true; }
  });
  return { resolved, won };
}
export function winStats(uid, results) {
  const posts = userPosts(uid, results);
  let resolved = 0; let won = 0;
  posts.forEach((p) => { const e = evalPost(p, results); if (e.resolved) { resolved += 1; if (e.won) won += 1; } });
  return { resolved, won, pct: resolved >= FOLLOW_MIN_DRAWS ? Math.round((won / resolved) * 100) : null, posts: posts.length };
}

export function userInfo(id, me) {
  const s = SEED_USERS.find((x) => x.uid === id);
  if (s) return s;
  if (me && me.uid === id) return me;
  return { uid: id, name: 'Player', avatar: 0 };
}
