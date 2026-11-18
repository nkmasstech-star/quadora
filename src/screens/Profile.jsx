import { useState } from 'preact/hooks';
import { AppBar, BackBar, Panel, Sheet, Locked, Loading } from '../ui.jsx';
import { IconGear } from '../icons.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { Avatar, AVATAR_THEMES } from '../avatars.jsx';
import { setAvatar } from '../data/account.js';
import { userPosts, winStats, followersOf, followingOf, toggleFollow, userInfo, postedToday } from '../data/community.js';
import { PostCard, WinBadge, Composer } from './Community.jsx';

function AvatarPicker({ current, onPick, onClose }) {
  const [th, setTh] = useState(Math.floor(current / 100) % 10);
  return (
    <Sheet title={t('Choose your avatar')} onClose={onClose}>
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

// Own profile tab (/profile) or another player's page (/user/:id)
export function Profile({ user, uid, data, toast, onUser }) {
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState(!!(import.meta.env.DEV && location.search.includes('avatars')));
  const [composer, setComposer] = useState(false);
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
  const posts = userPosts(id, results);
  const following = followingOf(user.uid).includes(id);

  return (
    <div>
      {own
        ? <AppBar title={t('Profile')} tagline={t('Your page')} go={go} right={<button class="icon-btn" aria-label={t('Settings')} onClick={() => go('/settings')}><IconGear /></button>} />
        : <BackBar title={t('Player')} />}

      <div class="pf-card">
        <button class="plain-btn" disabled={!own} onClick={() => own && setPicker(true)} aria-label={t('Change avatar')}><Avatar id={u.avatar} size={84} ring /></button>
        <div class="pf-name">{u.name}</div>
        {own && <div class="meta" style="margin-top:-2px">{t('Tap your avatar to change it')}</div>}
        <div class="pf-stats">
          <div><b>{st.posts}</b><span>{t('Posts')}</span></div>
          <div><b>{followersOf(id, user.uid)}</b><span>{t('Followers')}</span></div>
          <div><b>{st.pct == null ? '—' : `${st.pct}%`}</b><span>{t('Winning')}</span></div>
        </div>
        {st.pct == null && <div class="meta" style="font-size:12px">{t('Winning % shows after 4 checked posts. Checked: {n}', { n: st.resolved })}</div>}
        {own
          ? <button class="btn" style="margin-top:12px" onClick={() => (postedToday(user.uid) ? toast(t('You have already posted today. See your post below.')) : setComposer(true))}>{t('Place your prediction')}</button>
          : <button class={following ? 'btn ghost' : 'btn'} style="margin-top:12px" onClick={() => { toggleFollow(user.uid, id); refresh(); }}>{following ? t('Following') : t('Follow')}</button>}
      </div>

      <div class="section-title"><h2>{t('Posts')}</h2><WinBadge stats={st} /></div>
      {posts.length === 0 && <Panel><div class="empty">{t('No posts yet.')}</div></Panel>}
      {posts.slice(0, 30).map((p) => <PostCard key={p.id} p={p} me={user} results={results} stats={st} onChange={refresh} toast={toast} hideActions hideFollow />)}
      {own && posts.length > 0 && <div class="meta" style="text-align:center;font-size:12px;margin-top:6px">{t('To edit or delete today\'s post, open the Community tab before 2 PM India time.')}</div>}

      {picker && <AvatarPicker current={u.avatar} onClose={() => setPicker(false)} onPick={(a) => { const nu = setAvatar(a); onUser(nu); setPicker(false); }} />}
      {composer && <Composer me={user} toast={toast} onClose={() => setComposer(false)} onDone={() => { setComposer(false); refresh(); }} />}
    </div>
  );
}
