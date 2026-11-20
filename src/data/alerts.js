import { myLucky, myPicks, savedPosts, userPosts, evalEntry, evalPost } from './community.js';
import { gameById } from './games.js';

// Builds the in-app notification list: every saved lucky number, private pick, saved post and own post
// whose draw result is out, with the match result.
export function buildAlerts(user, results) {
  if (!user || !results) return [];
  const out = [];
  const gname = (id) => (gameById(id) || {}).name || id;
  myLucky(user.uid).forEach((x) => {
    const e = evalEntry(x.game, x.format, [x.n], x.forDate, results);
    if (e.resolved) out.push({ id: x.id, kind: 'lucky', won: e.won, date: x.forDate, title: e.won ? `Lucky number ${x.n} matched` : `Lucky number ${x.n} did not match`, sub: `${gname(x.game)} · ${e.hits.map((h) => h.prize).join(', ')}`, game: x.game });
  });
  myPicks(user.uid).forEach((x) => {
    x.picks.forEach((k, i) => {
      const e = evalEntry(k.game, k.format, k.sets, k.forDate, results);
      if (e.resolved) out.push({ id: `${x.id}-${i}`, kind: 'pick', won: e.won, date: k.forDate, title: e.won ? 'Your saved prediction matched' : 'Your saved prediction did not match', sub: `${gname(k.game)} · ${k.sets.join(' ')}`, game: k.game });
    });
  });
  savedPosts(user.uid, results).forEach((p) => {
    const e = evalPost(p, results);
    if (e.resolved) out.push({ id: `sp-${p.id}`, kind: 'saved', won: e.won, date: p.picks[0].forDate, title: e.won ? 'A post you saved matched' : 'A post you saved did not match', sub: p.picks.map((k) => gname(k.game)).join(' + '), game: p.picks[0].game });
  });
  userPosts(user.uid, results).filter((p) => !p.seed).forEach((p) => {
    const e = evalPost(p, results);
    if (e.resolved) out.push({ id: `mp-${p.id}`, kind: 'post', won: e.won, date: p.picks[0].forDate, title: e.won ? 'Your post matched' : 'Your post did not match', sub: p.picks.map((k) => gname(k.game)).join(' + '), game: p.picks[0].game });
  });
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}

export const notifOn = () => { try { return localStorage.getItem('qd_notif') !== '0'; } catch (e) { return true; } };
export const setNotif = (v) => { try { localStorage.setItem('qd_notif', v ? '1' : '0'); } catch (e) { /* ignore */ } };
