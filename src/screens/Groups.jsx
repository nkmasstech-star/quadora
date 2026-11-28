// Community > Groups tab (create / join / my groups) and the group page (/group/CODE).
import { useState, useEffect } from 'preact/hooks';
import { BackBar, Panel, Sheet, Loading } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { GAMES, gameById, fmtShort } from '../data/games.js';
import { Avatar } from '../avatars.jsx';
import { C } from '../data/cloud.js';
import { userInfo, followingOf, postedToday } from '../data/community.js';
import { shareText } from '../data/share.js';
import { GROUP_ICONS, GROUP_MAX, groupById, isPublic, isMember, openGroup, toggleGroupFollow, createGroup, joinGroup, findGroup, leaveGroup, renameGroup, setGroupIcon, addMember, removeMember, deleteGroup, loadGroupPosts, groupPosts, watchChallenges, callChallenge, deleteChallenge, rankDraw, playedDraws } from '../data/groups.js';
import { PostCard, Composer, Fab } from './Community.jsx';
import { Tick } from '../Tick.jsx';
import { winStats } from '../data/community.js';

const SHORT = (n) => n.replace(' 4D', '').replace(' 1+3D', '').replace('Sports ', '').replace('Grand Dragon Lotto', 'GD Lotto');
const MEDAL = ['🥇', '🥈', '🥉'];

export function GroupIcon({ icon, size = 44 }) {
  return <span class="gicon" style={`width:${size}px;height:${size}px;font-size:${Math.round(size * 0.55)}px`}>{GROUP_ICONS[icon] || '👥'}</span>;
}

export const shareGroup = (me, g, toast) => shareText(`👥 ${t('Join my 4D group "{g}" on Q Spot 4D!', { g: g.name })}\n${t('Install the app, log in, then open Community → Groups → Join and enter code: {c}', { c: g.id })}`, { uid: me.uid, gid: g.id, toast });

function NameIconSheet({ title, init, onSave, onClose, busy }) {
  const [name, setName] = useState(init ? init.name : '');
  const [icon, setIcon] = useState(init ? init.icon : 0);
  const ok = name.trim().length >= 2;
  return (
    <Sheet title={title} onClose={onClose}>
      <div class="meta" style="margin-bottom:6px">{t('Group name')}</div>
      <input class="input" maxLength={30} value={name} placeholder={t('e.g. Lucky Friends')} onInput={(e) => setName(e.currentTarget.value.slice(0, 30))} />
      <div class="meta" style="margin:12px 0 6px">{t('Group icon')}</div>
      <div class="gicon-grid">
        {GROUP_ICONS.map((x, i) => <button key={i} class={icon === i ? 'gpick on' : 'gpick'} onClick={() => setIcon(i)} aria-label={`${t('Icon')} ${i + 1}`}>{x}</button>)}
      </div>
      <button class="btn" style="margin-top:14px" disabled={!ok || busy} onClick={() => onSave(name, icon)}>{busy ? t('Please wait…') : t('Save')}</button>
    </Sheet>
  );
}

function JoinSheet({ me, onClose, toast, initial }) {
  const [code, setCode] = useState(initial || '');
  const [g, setG] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setG(null); setErr(''); if (code.length === 6) findGroup(code).then((x) => { setG(x); if (!x) setErr(t('No group found with this code.')); }); }, [code]);
  const join = async () => {
    setBusy(true); const r = await joinGroup(me, code); setBusy(false);
    if (r.error) { setErr(t(r.error)); return; }
    toast(t('You joined the group')); onClose(); go(`/group/${r.id}`);
  };
  return (
    <Sheet title={t('Join a group')} onClose={onClose}>
      <div class="meta" style="margin-bottom:6px">{t('Enter the 6-letter code your friend shared')}</div>
      <input class="input big-input" style="letter-spacing:.3em;text-transform:uppercase;text-align:center" maxLength={6} value={code} placeholder="ABC123" onInput={(e) => setCode(e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
      {g && <div class="hit" style="margin-top:12px"><GroupIcon icon={g.icon} size={40} /><span style="flex:1"><b>{g.name}</b><span class="meta" style="display:block">{t('{n} members', { n: g.members.length })}</span></span></div>}
      {err && <div class="form-err" role="alert" style="margin-top:10px">{err}</div>}
      <button class="btn" style="margin-top:14px" disabled={!g || busy} onClick={join}>{busy ? t('Please wait…') : t('Join group')}</button>
    </Sheet>
  );
}

function TypeSheet({ onPick, onClose }) {
  return (
    <Sheet title={t('Create group')} onClose={onClose}>
      <button class="gtype" onClick={() => onPick('private')}>
        <span class="gt-ic">🔒</span>
        <span><b>{t('Private group')}</b><small>{t('Only people you invite with the code can join. You can add or remove members.')}</small></span>
      </button>
      <button class="gtype" onClick={() => onPick('public')}>
        <span class="gt-ic">🌐</span>
        <span><b>{t('Public group')}</b><small>{t('Anyone can find, join, follow and post. Posts also show in Feeds. Nobody can be removed.')}</small></span>
      </button>
    </Sheet>
  );
}

function GroupRow({ g, me, toast }) {
  const member = isMember(g, me.uid);
  const join = async (e) => { e.stopPropagation(); const r = await joinGroup(me, g.id); if (r.error) toast(t(r.error)); else { toast(t('You joined the group')); go(`/group/${g.id}`); } };
  return (
    <div class="grp-card" role="button" tabIndex={0} onClick={() => go(`/group/${g.id}`)}>
      <GroupIcon icon={g.icon} />
      <span style="flex:1;min-width:0;text-align:left"><b>{g.name}</b><small>{isPublic(g) ? '🌐 ' + t('Public') : '🔒 ' + t('Private')} · {t('{n} members', { n: g.members.length })}{g.owner === me.uid ? ` · ${t('Admin')}` : ''}</small></span>
      {member ? <span class="chev">›</span> : <button class="chip-btn small on" onClick={join}>{t('Join')}</button>}
    </div>
  );
}

export function GroupsTab({ me, toast }) {
  const [step, setStep] = useState(null); // type | {type}
  const [join, setJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = C.groups || [];
  const pub = (C.pubGroups || []).filter((g) => !isMember(g, me.uid));
  const doCreate = async (name, icon) => {
    setBusy(true); const r = await createGroup(me, name, icon, step.type); setBusy(false);
    if (r.error) { toast(t(r.error)); return; }
    setStep(null); toast(t('Group created. Share the code with your friends.')); go(`/group/${r.id}`);
  };
  return (
    <div>
      {mine.length > 0 && <div class="sec-h">{t('My groups')}</div>}
      {mine.map((g) => <GroupRow key={g.id} g={g} me={me} toast={toast} />)}
      <div class="sec-h" style="display:flex;align-items:center">{t('Public groups')}<button class="link-btn" onClick={() => setJoin(true)}>🔑 {t('Join with code')}</button></div>
      {pub.length === 0 && <Panel><div class="empty">{t('No public groups yet. Tap + to create one.')}</div></Panel>}
      {pub.map((g) => <GroupRow key={g.id} g={g} me={me} toast={toast} />)}
      <Fab label={t('Create group')} onClick={() => setStep('type')} />
      {step === 'type' && <TypeSheet onClose={() => setStep(null)} onPick={(type) => setStep({ type })} />}
      {step && step.type && <NameIconSheet title={step.type === 'public' ? t('Public group') : t('Private group')} busy={busy} onSave={doCreate} onClose={() => setStep(null)} />}
      {join && <JoinSheet me={me} toast={toast} onClose={() => setJoin(false)} />}
    </div>
  );
}

// ranked picks of the members for one game + draw
function RankCard({ g, posts, game, date, results, me, title }) {
  const r = rankDraw(g, posts, game, date, results);
  const gm = gameById(game);
  return (
    <div class="pcard rankc" data-game={game}>
      <div class="rank-h"><b>{title || `${gm ? gm.name : game}`}</b><span class="meta">{t('Draw')} {fmtShort(date)}</span></div>
      {!r.resolved && <div class="meta" style="margin:6px 0">{t('{n} members posted. Ranking shows after the official result.', { n: new Set(r.rows.map((x) => x.uid)).size })}</div>}
      {r.rows.length === 0 && <div class="meta" style="margin:6px 0">{t('No member has posted for this draw yet.')}</div>}
      {r.resolved && r.rows.map((x, i) => {
        const u = userInfo(x.uid, me);
        const won = x.hits.length > 0;
        return (
          <div key={x.post.id + i} class={won ? 'rank-row won' : 'rank-row'}>
            <span class="rank-pos">{won ? (MEDAL[i] || i + 1) : '–'}</span>
            <Avatar id={u.avatar} size={32} />
            <span style="flex:1;min-width:0"><b>{u.name}</b> <Tick uid={x.uid} size={13} /><small>{x.pick.sets.join(' ')} · {t(x.pick.format)}</small></span>
            <span class="rank-prize">{won ? x.hits.map((h) => t(h.prize)).join(', ') : t('No match')}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChallengeSheet({ me, g, onClose, toast }) {
  const [busy, setBusy] = useState(false);
  const call = async (game) => {
    setBusy(true); const r = await callChallenge(me, g, game); setBusy(false);
    if (r.error) { toast(t(r.error)); return; }
    toast(t('Challenge called. Members were notified.')); onClose();
  };
  return (
    <Sheet title={t('Call a challenge')} onClose={onClose}>
      <div class="meta" style="margin-bottom:10px;line-height:1.5">{t('Pick a game. Members post their numbers for the next draw, and after the result the group sees who won.')}</div>
      <div class="chipwrap" style="margin:0">
        {GAMES.map((x) => <button key={x.id} class="chip-btn" disabled={busy} onClick={() => call(x.id)}>{SHORT(x.name)}</button>)}
      </div>
    </Sheet>
  );
}

function MembersSheet({ me, g, onClose }) {
  const cand = followingOf(me.uid).filter((u) => !g.members.includes(u));
  return (
    <Sheet title={t('Add members')} onClose={onClose}>
      <div class="meta" style="margin-bottom:8px">{t('Players you follow. Others can join with the group code.')}</div>
      {cand.length === 0 && <div class="empty">{t('Follow players in Feeds to add them here, or share the group code.')}</div>}
      {cand.map((uid) => { const u = userInfo(uid, me); return (
        <div key={uid} class="mrow"><Avatar id={u.avatar} size={36} /><b style="flex:1">{u.name}</b><button class="chip-btn small on" disabled={g.members.length >= GROUP_MAX} onClick={() => { addMember(me, g, uid); onClose(); }}>{t('Add')}</button></div>
      ); })}
    </Sheet>
  );
}

export function GroupPage({ me, gid, data, toast }) {
  const [tab, setTab] = useState('posts');
  const [miss, setMiss] = useState(false);
  const [sheet, setSheet] = useState(null); // edit | challenge | add | composer
  const [, tick] = useState(0);
  const g = groupById(gid);
  useEffect(() => { if (!g) openGroup(gid).then((x) => { if (!x) setMiss(true); }); }, [gid]);
  useEffect(() => { if (g) loadGroupPosts(g); }, [gid, g && g.members.length]);
  const member = isMember(g, me.uid);
  useEffect(() => (member ? watchChallenges(gid) : undefined), [gid, member]);
  if (!g) return (<div><BackBar title={t('Group')} />{miss ? <Panel><div class="empty">{t('This group was deleted or you are no longer a member.')}</div></Panel> : <Loading />}</div>);
  const admin = g.owner === me.uid;
  const pub = isPublic(g);
  const following = !!C.gfollow[g.id];
  const doJoin = async () => { const r = await joinGroup(me, g.id); if (r.error) toast(t(r.error)); else toast(t('You joined the group')); refreshNow(); };
  const openPost = () => (postedToday(me.uid, pub ? g.id : null) ? toast(pub ? t('You have already posted in this group today.') : t('You have already posted today. See your post in Profile.')) : setSheet('composer'));
  const posts = groupPosts(g);
  const results = data.results;
  const chal = C.gchal[gid] || [];
  const refresh = () => tick((n) => n + 1);
  function refreshNow() { tick((n) => n + 1); }

  let body = null;
  if (tab === 'challenges') {
    body = (
      <div>
        {member ? <button class="btn" style="margin:4px 0 12px" onClick={() => setSheet('challenge')}>⚔️ {t('Call a challenge')}</button> : <Panel><div class="empty">{t('Join the group to see and call challenges.')}</div></Panel>}
        {chal.length === 0 && <Panel><div class="empty">{t('No challenges yet. Call one for the next draw!')}</div></Panel>}
        {chal.map((c) => (
          <div key={c.id}>
            <div class="meta chal-by">⚔️ {t('{n} called this challenge', { n: c.byName || userInfo(c.by, me).name })}{(admin || c.by === me.uid) && <button class="link-btn" onClick={() => { if (confirm(t('Remove this challenge?'))) deleteChallenge(g, c); }}>{t('Remove')}</button>}</div>
            <RankCard g={g} posts={posts} game={c.game} date={c.forDate} results={results} me={me} />
          </div>
        ))}
      </div>
    );
  } else if (tab === 'posts') {
    body = posts.length === 0 ? <Panel><div class="empty">{t('Posts by group members appear here.')}</div></Panel>
      : posts.slice(0, 40).map((p) => <PostCard key={p.id} p={p} me={me} results={results} stats={winStats(p.uid, results)} onChange={refresh} toast={toast} hideGroup />);
  } else if (tab === 'ranking') {
    const draws = playedDraws(g, posts).filter((d) => rankDraw(g, posts, d.game, d.date, results).resolved).slice(0, 8);
    body = draws.length === 0 ? <Panel><div class="empty">{t('Rankings appear after the results of draws members posted for.')}</div></Panel>
      : draws.map((d) => <RankCard key={d.game + d.date} g={g} posts={posts} game={d.game} date={d.date} results={results} me={me} />);
  } else {
    body = (
      <div>
        {admin && <button class="btn ghost" style="margin:4px 0 10px;height:46px" onClick={() => setSheet('add')}>＋ {t('Add members')}</button>}
        {pub && <div class="meta" style="margin:0 4px 8px;font-size:12px">{t('Public group: anyone can join. Members cannot be removed.')}</div>}
        {g.members.map((uid) => { const u = userInfo(uid, me); return (
          <div key={uid} class="mrow">
            <button class="plain-btn" onClick={() => go(uid === me.uid ? '/profile' : `/user/${uid}`)}><Avatar id={u.avatar} size={38} /></button>
            <span style="flex:1;min-width:0"><b>{u.name}</b> <Tick uid={uid} size={13} />{uid === g.owner && <small class="pill gold" style="margin-left:6px">{t('Admin')}</small>}</span>
            {admin && !pub && uid !== me.uid && <button class="chip-btn small danger" onClick={() => { if (confirm(t('Remove {n} from the group? Their posts and ranks leave the group too.', { n: u.name }))) removeMember(g, uid); }}>{t('Remove')}</button>}
          </div>
        ); })}
        <div style="margin-top:16px">
          {admin
            ? <button class="btn text danger" onClick={() => { if (confirm(t('Delete this group for everyone?'))) { deleteGroup(g); go('/community'); toast(t('Group deleted')); } }}>{t('Delete group')}</button>
            : member && <button class="btn text danger" onClick={() => { if (confirm(t('Leave this group?'))) { leaveGroup(me, g); go('/community'); } }}>{t('Leave group')}</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackBar title={t('Group')} right={admin && <button class="icon-btn" aria-label={t('Edit group')} onClick={() => setSheet('edit')}>✎</button>} />
      <div class="pcard ghead">
        <GroupIcon icon={g.icon} size={64} />
        <div class="ghead-name">{g.name}</div>
        <div class="meta">{pub ? '🌐 ' + t('Public') : '🔒 ' + t('Private')} · {t('{n} members', { n: g.members.length })}{member && <span> · {t('Code')} <b style="letter-spacing:.15em">{g.id}</b></span>}</div>
        <div class="gbtns">
          {member ? <button class="btn" onClick={() => shareGroup(me, g, toast)}>{t('Invite friends')}</button> : <button class="btn" onClick={doJoin}>{t('Join group')}</button>}
          {pub && <button class={following ? 'btn ghost on' : 'btn ghost'} onClick={() => { toggleGroupFollow(me.uid, g); refreshNow(); }}>{following ? '✓ ' + t('Following') : t('Follow')}</button>}
        </div>
      </div>
      <div class="tabs" role="tablist" style="margin-top:12px">
        {[['posts', 'Posts'], ['challenges', 'Challenges'], ['ranking', 'Ranking'], ['members', 'Members']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} class={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>{t(l)}</button>)}
      </div>
      <div style="margin-top:8px">{body}</div>
      {sheet === 'edit' && <NameIconSheet title={t('Edit group')} init={g} onClose={() => setSheet(null)} onSave={(n, i) => { if (n.trim() !== g.name) renameGroup(g, n); if (i !== g.icon) setGroupIcon(g, i); setSheet(null); toast(t('Saved')); }} />}
      {sheet === 'challenge' && <ChallengeSheet me={me} g={g} toast={toast} onClose={() => setSheet(null)} />}
      {sheet === 'add' && <MembersSheet me={me} g={g} onClose={() => setSheet(null)} />}
      {member && <Fab label={t('Post numbers')} onClick={openPost} />}
      {sheet === 'composer' && <Composer me={me} group={pub ? g : null} toast={toast} onClose={() => setSheet(null)} onDone={() => { setSheet(null); loadGroupPosts(g); }} />}
    </div>
  );
}

// a new player who installed from a group invite link is offered to join it
export function GroupInvite({ me, code, onDone, toast }) {
  const [g, setG] = useState(null);
  useEffect(() => { findGroup(code).then((x) => { if (!x || x.members.includes(me.uid)) onDone(); else setG(x); }); }, [code]);
  if (!g) return null;
  return (
    <div class="exit-wrap" role="dialog" aria-modal="true">
      <div class="exit-scrim" onClick={onDone} />
      <div class="exit-box">
        <GroupIcon icon={g.icon} size={60} />
        <div class="exit-title" style="text-align:center">{t('You are invited to "{g}"', { g: g.name })}</div>
        <div class="meta" style="text-align:center">{t('{n} members', { n: g.members.length })}</div>
        <button class="btn" style="margin-top:6px" onClick={async () => { const r = await joinGroup(me, g.id); onDone(); if (r.error) toast(t(r.error)); else { toast(t('You joined the group')); go(`/group/${g.id}`); } }}>{t('Join group')}</button>
        <button class="btn text" onClick={onDone}>{t('Not now')}</button>
      </div>
    </div>
  );
}
