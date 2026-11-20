import { useState } from 'preact/hooks';
import { AppBar, BackBar, Panel, Sheet, Locked, Loading } from '../ui.jsx';
import { IconGear } from '../icons.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { Avatar, AVATAR_THEMES } from '../avatars.jsx';
import { setAvatar, renameUser, validName } from '../data/account.js';
import { NAME_EDITS, AVATAR_EDITS, NAME_MAX } from '../config.js';
import { gameById, fmtShort } from '../data/games.js';
import { addInbox } from '../data/inbox.js';
import { userPosts, winStats, followersOf, followingOf, followingCount, toggleFollow, userInfo, postedToday, savedPosts, myLucky, myPicks, delLucky, delPick, evalEntry, visiblePosts } from '../data/community.js';
import { PostCard, WinBadge, Composer } from './Community.jsx';

function AvatarPicker({ current, onPick, onClose, left }) {
  const [th, setTh] = useState(Math.floor(current / 100) % 10);
  return (
    <Sheet title={t('Choose your avatar')} onClose={onClose}>
      <div class="meta" style="margin-bottom:8px">{t('Avatar changes left: {n}', { n: left })}</div>
      <div class="chipwrap" style="margin:0 0 12px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">
        {AVATAR_THEMES.map((a, i) => <button key={a.name} class={th === i ? 'chip-btn on small' : 'chip-btn small'} style="flex:none" onClick={() => setTh(i)}>{t(a.name)}</button>)}
      </div>
      <div class="av-grid">
        {Array.from({ length: 100 }, (_, k) => th * 100 + k).map((id) => (
          <button key={id} class={id === current ? 'av-pick on' : 'av-pick'} aria-label={`${t('Avatar')} ${id + 1}`} onClick={() => onPick(id)}><Avatar id={id} size={52} /></button>
        ))}
      </div>
    </Sheet>
  );
}

function NameSheet({ user, onClose, onDone, toast }) {
  const [v, setV] = useState(user.name);
  const [err, setErr] = useState('');
  const left = NAME_EDITS - (user.nameEdits || 0);
  const save = () => {
    const r = renameUser(v);
    if (r.error) { setErr(r.error); return; }
    toast(t('Name updated')); onDone(r.user);
  };
  return (
    <Sheet title={t('Edit name')} onClose={onClose}>
      <div class="meta" style="margin-bottom:8px;line-height:1.5">{t('Letters only, up to {n} characters. No numbers, emoji or symbols. Changes left: {c}', { n: NAME_MAX, c: left })}</div>
      <input class="input" value={v} maxLength={NAME_MAX} autocomplete="off" onInput={(e) => { const c = e.currentTarget.value.replace(/[^\p{L}\p{M} ]/gu, '').slice(0, NAME_MAX); e.currentTarget.value = c; setV(c); }} />
      <div class="meta" style="text-align:right;font-size:12px;margin:4px 2px 10px">{v.length}/{NAME_MAX}</div>
      {err && <div class="form-err" role="alert">{t(err)}</div>}
      <button class="btn" disabled={left <= 0 || !validName(v.trim()) || v.trim() === user.name} onClick={save}>{t('Save name')}</button>
    </Sheet>
  );
}

function EntryRow({ title, sub, ev, game, onDelete }) {
  return (
    <div class="hit" data-game={game}>
      <span class="n">{title}</span>
      <span style="flex:1;min-width:0"><span style="display:block;font-weight:700;font-size:14px">{sub}</span>
        <span class="meta">{ev.resolved ? (ev.won ? `🎉 ${t('Matched')} ${ev.hits.map((h) => h.prize).join(', ')}` : t('Did not match')) : t('Waiting for the result')}</span></span>
      <button class="del-btn" aria-label={t('Delete')} onClick={onDelete}>×</button>
    </div>
  );
}

// Own profile tab (/profile) or another player's page (/user/:id)
export function Profile({ user, uid, data, toast, onUser }) {
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState(!!(import.meta.env.DEV && location.search.includes('avatars')));
  const [nameOpen, setNameOpen] = useState(!!(import.meta.env.DEV && location.search.includes('rename')));
  const [composer, setComposer] = useState(false);
  const [tab, setTab] = useState(import.meta.env.DEV ? (new URLSearchParams(location.search).get('ptab') || 'posts') : 'posts');
  const refresh = () => setTick((n) => n + 1);
  const results = data.results;

  if (!uid && !user) {
    return (
      <div>
        <AppBar title={t('Profile')} tagline={t('Your page')} go={go} right={<button class="icon-btn" aria-label={t('Settings')} onClick={() => go('/settings')}><IconGear /></button>} />
        <Locked onLogin={() => go('/login')} text={t('Log in to get your profile, post predictions and collect followers.')} />
      </div>
    );
  }
  if (!user) return <Locked onLogin={() => go('/login')} />;
  if (data.status === 'loading' && !results) return <Loading />;

  const id = uid || user.uid;
  const own = id === user.uid;
  const u = userInfo(id, user);
  const st = winStats(id, results);
  const following = followingOf(user.uid).includes(id);
  const gname = (g) => (gameById(g) || {}).name || g;

  const tabs = own ? [['posts', 'Posts'], ['saved', 'Saved'], ['lucky', 'Lucky'], ['picks', 'My picks']] : [['posts', 'Posts']];
  let body = null;
  if (tab === 'posts') {
    const posts = visiblePosts(userPosts(id, results), user);
    body = posts.length === 0 ? <Panel><div class="empty">{t('No posts yet.')}</div></Panel> : posts.slice(0, 30).map((p) => <PostCard key={p.id} p={p} me={user} results={results} stats={st} onChange={refresh} toast={toast} hideActions hideFollow />);
  } else if (tab === 'saved') {
    const l = savedPosts(user.uid, results);
    body = l.length === 0 ? <Panel><div class="empty">{t('Posts you save appear here. We check them when the result is out.')}</div></Panel> : l.map((p) => <PostCard key={p.id} p={p} me={user} results={results} stats={winStats(p.uid, results)} onChange={refresh} toast={toast} hideActions />);
  } else if (tab === 'lucky') {
    const l = myLucky(user.uid);
    body = l.length === 0 ? <Panel><div class="empty">{t('Lucky numbers you save from the Lucky Game or Scratch Card appear here.')}</div></Panel> : l.map((x) => <EntryRow key={x.id} title={x.n} game={x.game} sub={`${gname(x.game)} · ${t(x.format)} · ${t('Draw')} ${fmtShort(x.forDate)}`} ev={evalEntry(x.game, x.format, [x.n], x.forDate, results)} onDelete={() => { delLucky(user.uid, x.id); refresh(); }} />);
  } else if (tab === 'picks') {
    const l = myPicks(user.uid);
    body = l.length === 0 ? <Panel><div class="empty">{t('Predictions you save only for yourself appear here.')}</div></Panel> : l.map((x) => x.picks.map((k, i) => <EntryRow key={`${x.id}${i}`} title={k.sets[0]} game={k.game} sub={`${gname(k.game)} · ${t(k.format)} · ${k.sets.join(' ')}`} ev={evalEntry(k.game, k.format, k.sets, k.forDate, results)} onDelete={() => { delPick(user.uid, x.id); refresh(); }} />));
  }

  return (
    <div>
      {own
        ? <AppBar title={t('Profile')} tagline={t('Your page')} go={go} right={<button class="icon-btn" aria-label={t('Settings')} onClick={() => go('/settings')}><IconGear /></button>} />
        : <BackBar title={t('Player')} />}

      <div class="pf-wrap">
        <div class="pf-cover" />
        <div class="pf-main">
          <button class="plain-btn pf-av" disabled={!own} onClick={() => own && setPicker(true)} aria-label={t('Change avatar')}><Avatar id={u.avatar} size={88} ring /></button>
          <div class="pf-name">{u.name}</div>
          <div class="pf-stats">
            <div><b>{st.posts}</b><span>{t('Posts')}</span></div>
            <div><b>{followersOf(id, user.uid)}</b><span>{t('Followers')}</span></div>
            <div><b>{id === user.uid ? followingCount(id) : '—'}</b><span>{t('Following')}</span></div>
            <div><b>{st.pct == null ? '—' : `${st.pct}%`}</b><span>{t('Winning')}</span></div>
          </div>
          {st.pct == null && <div class="meta" style="font-size:12px;text-align:center">{t('Winning % shows after 4 checked posts. Checked: {n}', { n: st.resolved })}</div>}
          {own
            ? <div class="pf-btns"><button class="btn ghost" onClick={() => setNameOpen(true)}>{t('Edit profile')}</button><button class="btn" onClick={() => (postedToday(user.uid) ? toast(t('You have already posted today. See your post below.')) : setComposer(true))}>{t('Place your prediction')}</button></div>
            : <button class={following ? 'btn ghost' : 'btn'} onClick={() => { const was = following; toggleFollow(user.uid, id); if (!was) addInbox(id, { type: 'follow', from: user.name, fromUid: user.uid }); refresh(); }}>{following ? t('Following') : t('Follow')}</button>}
        </div>
      </div>

      <div class="tabs" role="tablist" style="margin-top:14px">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} class={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>{t(l)}</button>)}
      </div>
      {tab === 'posts' && <div class="section-title"><h2>{t('Posts')}</h2><WinBadge stats={st} /></div>}
      <div style="margin-top:8px">{body}</div>

      {picker && <AvatarPicker current={u.avatar} left={AVATAR_EDITS - (user.avatarEdits || 0)} onClose={() => setPicker(false)} onPick={(a) => { const r = setAvatar(a); if (r.error) { toast(t(r.error)); return; } onUser(r.user); setPicker(false); }} />}
      {nameOpen && <NameSheet user={user} toast={toast} onClose={() => setNameOpen(false)} onDone={(nu) => { onUser(nu); setNameOpen(false); }} />}
      {composer && <Composer me={user} toast={toast} onClose={() => setComposer(false)} onDone={() => { setComposer(false); refresh(); }} />}
    </div>
  );
}
