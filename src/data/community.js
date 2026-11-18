// TEST community layer: everything lives on this phone (localStorage) plus generated sample players.
// When Firebase (Firestore) is connected, replace the load/save functions; screens keep working.
import { GAMES } from './games.js';
import { drawsOf, prizeEntries } from './store.js';
import { EDIT_CUTOFF_HOUR_IST, FOLLOW_MIN_DRAWS } from '../config.js';

export const FORMATS = ['Straight', 'iBox', 'Multi'];
export const MAX_GAMES = 2;
export const MAX_SETS = 4;

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

// ---------- India time ----------
export function ist(d = new Date()) {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  const date = `${p.year}-${p.month}-${p.day}`;
  const dow = new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay();
  return { date, hour: +p.hour % 24, minute: +p.minute, dow };
}
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d + n)); return x.toISOString().slice(0, 10); };
const dowOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

export const editOpen = () => ist().hour < EDIT_CUTOFF_HOUR_IST;

// The draw a new post is for: today's draw if it is a draw day and it is before the cutoff, else the next draw day.
export function targetDraw(game) {
  const n = ist();
  for (let i = 0; i < 8; i += 1) {
    if (i === 0 && n.hour >= EDIT_CUTOFF_HOUR_IST) continue;
    const date = addDays(n.date, i);
    if (game.days.includes(dowOf(date))) return date;
  }
  return n.date;
}

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
    const n = ist();
    out.push({ id: `seed-${u.uid}-today`, uid: u.uid, day: n.date, at: Date.now() - (ui + 1) * 3600e3, edited: false, picks: [{ game: g.id, format: FORMATS[ui % 3], sets: [num4(tr), num4(tr), num4(tr)], forDate: targetDraw(g) }, { game: g2.id, format: FORMATS[(ui + 1) % 3], sets: [num4(tr), num4(tr)], forDate: targetDraw(g2) }], up: 3 + ui * 2, down: ui, seed: true });
  });
  return out;
}

// ---------- posts ----------
export const myPosts = () => read('qd_posts', []);
export function allPosts(results) {
  return [...myPosts(), ...seedPosts(results)].sort((a, b) => b.at - a.at);
}
export function userPosts(uid, results) { return allPosts(results).filter((p) => p.uid === uid); }
export const postedToday = (uid) => myPosts().some((p) => p.uid === uid && p.day === ist().date);
export const canEdit = (p, uid) => p.uid === uid && !p.seed && !p.edited && p.day === ist().date && editOpen();
export const canDelete = (p, uid) => p.uid === uid && !p.seed && p.day === ist().date && editOpen();

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
  const n = ist();
  const p = { id: `p${Date.now().toString(36)}`, uid, day: n.date, at: Date.now(), edited: false, picks: picks.map((k) => ({ ...k, forDate: targetDraw(GAMES.find((g) => g.id === k.game)) })), up: 0, down: 0 };
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

// ---------- votes & follows ----------
export const myVotes = () => read('qd_votes', {});
export function vote(postId, v) {
  const m = myVotes();
  if (m[postId] === v) delete m[postId]; else m[postId] = v;
  write('qd_votes', m);
}
export function votePct(p) {
  const m = myVotes()[p.id];
  const up = p.up + (m === 'up' ? 1 : 0);
  const down = p.down + (m === 'down' ? 1 : 0);
  const tot = up + down;
  return { up: tot ? Math.round((up / tot) * 100) : 0, down: tot ? 100 - Math.round((up / tot) * 100) : 0, mine: m || '' };
}
export const followingOf = (uid) => read(`qd_follows_${uid}`, []);
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
function pickWins(pick, draw) {
  const nums = prizeEntries(draw).map((e) => e.number);
  return pick.sets.some((s) => nums.some((n) => (pick.format === 'Straight' ? n === s : norm(n) === norm(s))));
}
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
