// Community layer: posts, likes, follows and players are live in Firestore (see cloud.js); saved picks and lucky numbers stay private on this phone.
import { GAMES } from './games.js';
import { drawsOf, prizeEntries } from './store.js';
import { FOLLOW_MIN_DRAWS } from '../config.js';
import { targetDraw as targetDrawId, cutoffMs } from './rules.js';
import { C, cloudCreate, cloudEdit, cloudDelete, cloudLike, cloudFollow, cloudReport, cloudDeleteMine } from './cloud.js';

export const FORMATS = ['Straight', 'iBox', 'Multi'];
export const MAX_GAMES = 2;
export const MAX_SETS = 4;

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

// ---------- dates (the phone's own calendar day) ----------
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const targetDraw = (g) => targetDrawId(g.id);

// ---------- posts ----------
export const myPosts = (uid) => C.posts.filter((p) => p.uid === uid);
export function allPosts() { return [...C.posts].sort((a, b) => b.at - a.at); }
// the main feed: newest 30 + pages loaded with "Load more"
export function feedPosts() { return [...(C.feed || C.posts)].sort((a, b) => b.at - a.at); }
export function userPosts(uid) { return allPosts().filter((p) => p.uid === uid); }
// one post a day on the main feed, and one a day in each public group
export const postedToday = (uid, gid = null) => myPosts(uid).some((p) => p.day === today() && (p.gid || null) === (gid || null));
// Edit/delete is open until 2 hours before the earliest draw in the post starts.
export const cutoffOf = (p) => Math.min(...p.picks.map((k) => cutoffMs(k.game, k.forDate)));
export const canEdit = (p, uid) => p.uid === uid && !p.edited && Date.now() < cutoffOf(p);
export const canDelete = (p, uid) => p.uid === uid && Date.now() < cutoffOf(p);

export function validPicks(picks) {
  if (!picks.length || picks.length > MAX_GAMES) return 'Choose 1 or 2 games.';
  for (const k of picks) {
    if (!k.sets.length || k.sets.length > MAX_SETS) return 'Add 1 to 4 numbers for each game.';
    if (k.sets.some((s) => !/^\d{4}$/.test(s))) return 'Every number needs exactly 4 digits.';
    if (new Set(k.sets).size !== k.sets.length) return 'Remove repeated numbers.';
  }
  return '';
}

export function createPost(uid, picks, group = null, text = '') {
  const p = { id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, uid, day: today(), at: Date.now(), edited: false, picks: picks.map((k) => ({ ...k, forDate: targetDraw(GAMES.find((g) => g.id === k.game)) })), up: 0, reports: 0 };
  if (group) { p.gid = group.id; p.gname = group.name; }
  if (text) p.text = text;
  cloudCreate(p);
  return p;
}
export function editPost(id, picks, text = '') { cloudEdit(id, picks.map((k) => ({ ...k, forDate: targetDraw(GAMES.find((g) => g.id === k.game)) })), text); }
export function deletePost(id) { cloudDelete(id); }

// ---------- likes, saves & follows ----------
export const myLikes = () => C.likes;
export function toggleLike(postId, uid) { cloudLike(uid, postId); }
export const likeCount = (p) => p.up || 0;
export const savedIds = (uid) => read(`qd_saved_${uid}`, []);
export function toggleSave(uid, postId) { const l = savedIds(uid); const i = l.indexOf(postId); if (i >= 0) l.splice(i, 1); else l.unshift(postId); write(`qd_saved_${uid}`, l); }
export const savedPosts = (uid) => { const ids = savedIds(uid); const all = allPosts(); return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean); };

// private picks (saved without posting) and saved lucky numbers
export const myPicks = (uid) => read(`qd_picks_${uid}`, []);
export function addPick(uid, picks) { const l = myPicks(uid); l.unshift({ id: `k${Date.now().toString(36)}`, at: Date.now(), picks: picks.map((k) => ({ ...k, forDate: targetDrawId(k.game) })) }); write(`qd_picks_${uid}`, l.slice(0, 100)); }
export function delPick(uid, id) { write(`qd_picks_${uid}`, myPicks(uid).filter((x) => x.id !== id)); }
export const myLucky = (uid) => read(`qd_luckyn_${uid}`, []);
export function addLucky(uid, n, game, format) { const l = myLucky(uid); l.unshift({ id: `l${Date.now().toString(36)}`, at: Date.now(), n, game, format, forDate: targetDrawId(game) }); write(`qd_luckyn_${uid}`, l.slice(0, 100)); }
export function delLucky(uid, id) { write(`qd_luckyn_${uid}`, myLucky(uid).filter((x) => x.id !== id)); }
export const followingOf = () => Object.keys(C.following);
export const followingCount = () => Object.keys(C.following).length;
export function toggleFollow(me, target) { cloudFollow(me, target); }
export function followersOf(uid) { const u = C.users[uid]; return u && u.followers ? u.followers : 0; }

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
  const posts = userPosts(uid);
  let resolved = 0; let won = 0;
  posts.forEach((p) => { const e = evalPost(p, results); if (e.resolved) { resolved += 1; if (e.won) won += 1; } });
  return { resolved, won, pct: resolved >= FOLLOW_MIN_DRAWS ? Math.round((won / resolved) * 100) : null, posts: posts.length };
}

export function userInfo(id, me) {
  if (me && me.uid === id) return me;
  const u = C.users[id];
  return u ? { uid: id, name: u.name || 'Player', avatar: u.avatar || 0 } : { uid: id, name: 'Player', avatar: 0 };
}

// ---- reports and blocks (3 reports hide a post for everyone until the owner/admin reviews it) ----
export const REPORT_REASONS = ['Spam or advertising', 'Abuse or hate', 'Scam or false claim', 'Adult or inappropriate content', 'Other'];
export const HIDE_AT = 3; // a post with this many reports is hidden until reviewed
const myReports = () => read('qd_reports', []);
export function reportPost(uid, postId, reason) {
  const l = myReports();
  if (l.some((r) => r.postId === postId && r.by === uid)) return false;
  l.push({ postId, by: uid, at: Date.now() }); write('qd_reports', l);
  cloudReport(uid, postId, reason);
  return true;
}
export const reportCount = (postId) => { const p = C.posts.find((x) => x.id === postId); return (p && p.reports) || 0; };
export const blockedOf = (uid) => read(`qd_blocks_${uid}`, []);
export function toggleBlock(me, target) {
  const l = blockedOf(me); const i = l.indexOf(target);
  if (i >= 0) l.splice(i, 1); else l.push(target);
  write(`qd_blocks_${me}`, l);
  return i < 0;
}
// posts the viewer should see: no blocked players, no posts hidden by reports (own posts always shown)
export const hiddenOf = (uid) => read(`qd_hide_${uid}`, []);
export function hidePost(uid, postId) { const l = hiddenOf(uid); if (!l.includes(postId)) l.push(postId); write(`qd_hide_${uid}`, l); }
export const visiblePosts = (list, me) => list.filter((p) => !me || (p.uid === me.uid) || (!blockedOf(me.uid).includes(p.uid) && reportCount(p.id) < HIDE_AT && !hiddenOf(me.uid).includes(p.id)));

// Settings > Delete my data (kept out of the lists so a stray tap can never remove history)
export const clearMyPosts = (uid) => cloudDeleteMine(uid);
export const clearMyPicks = (uid) => write(`qd_picks_${uid}`, []);
export const clearMyLucky = (uid) => write(`qd_luckyn_${uid}`, []);

// ---------- leaderboard: top players by winning ratio for posts made in the period ----------
export const BOARD_PERIODS = { week: { days: 7, min: 2 }, month: { days: 30, min: 3 }, all: { days: 0, min: 4 } };
export function leaderboard(period, results, me) {
  if (C.leaders && C.leaders[period]) return C.leaders[period].filter((r) => !me || !blockedOf(me.uid).includes(r.uid));
  const cfg = BOARD_PERIODS[period] || BOARD_PERIODS.week;
  const from = cfg.days ? Date.now() - cfg.days * 864e5 : 0;
  return rankRange(from, Infinity, cfg.min, results, me).slice(0, 10);
}
function rankRange(from, to, min, results, me) {
  const by = {};
  allPosts().forEach((p) => {
    if (p.at < from || p.at >= to) return;
    if (me && blockedOf(me.uid).includes(p.uid)) return;
    const e = evalPost(p, results);
    if (!e.resolved) return;
    const s = by[p.uid] || (by[p.uid] = { uid: p.uid, resolved: 0, won: 0 });
    s.resolved += 1; if (e.won) s.won += 1;
  });
  return Object.values(by)
    .filter((s) => s.resolved >= cfg.min && s.won > 0)
    .map((s) => ({ ...s, pct: Math.round((s.won / s.resolved) * 100) }))
    .sort((a, b) => b.won / b.resolved - a.won / a.resolved || b.won - a.won || b.resolved - a.resolved);
}

// ---------- Leaders medals: top 5 of the last finished week (silver), last finished month (gold) and all time up to
// the start of this month (diamond). Each is kept until the next week / month is finished. Times in Malaysia (UTC+8). ----------
const MYT = 8 * 3600e3;
let medalCache = { key: '', map: {} };
export function medalMap(results) {
  if (C.leaders && C.leaders.medals) return C.leaders.medals;
  const now = Date.now(); const d = new Date(now + MYT);
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - MYT;
  const weekStart = dayStart - ((d.getUTCDay() + 6) % 7) * 864e5; // Monday
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - MYT;
  const prevMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1) - MYT;
  const key = `${weekStart}|${C.posts.length}|${results && results.updated}`;
  if (medalCache.key === key) return medalCache.map;
  const map = {};
  const give = (rows, kind) => rows.slice(0, 5).forEach((r) => { if (!map[r.uid]) map[r.uid] = kind; });
  give(rankRange(0, monthStart, BOARD_PERIODS.all.min, results), 'diamond');
  give(rankRange(prevMonth, monthStart, BOARD_PERIODS.month.min, results), 'gold');
  give(rankRange(weekStart - 7 * 864e5, weekStart, BOARD_PERIODS.week.min, results), 'silver');
  medalCache = { key, map };
  return map;
}
