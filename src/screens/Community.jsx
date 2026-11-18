import { useState, useMemo } from 'preact/hooks';
import { AppBar, Panel, Sheet, Locked, Loading } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';
import { GAMES, gameById, fmtShort } from '../data/games.js';
import { Avatar } from '../avatars.jsx';
import { FORMATS, MAX_GAMES, MAX_SETS, allPosts, canEdit, canDelete, createPost, editPost, deletePost, validPicks, postedToday, vote, votePct, toggleFollow, followingOf, winStats, userInfo, evalPost } from '../data/community.js';

const SHORT = (n) => n.replace(' 4D', '').replace(' 1+3D', '').replace('Sports ', '').replace('Grand Dragon Lotto', 'GD Lotto');

export function WinBadge({ stats }) {
  if (stats.pct == null) return <span class="win new">{t('New')}</span>;
  return <span class="win">{stats.pct}% {t('wins')}</span>;
}

export function PostCard({ p, me, results, stats, onChange, toast, onEdit, hideActions, hideFollow }) {
  const u = userInfo(p.uid, me);
  const mine = me && p.uid === me.uid;
  const v = votePct(p);
  const following = me ? followingOf(me.uid).includes(p.uid) : false;
  const ev = evalPost(p, results);
  return (
    <div class="post">
      <div class="post-top">
        <button class="plain-btn" onClick={() => go(mine ? '/profile' : `/user/${p.uid}`)} aria-label={u.name}><Avatar id={u.avatar} size={42} /></button>
        <span style="flex:1;min-width:0">
          <button class="plain-btn name-btn" onClick={() => go(mine ? '/profile' : `/user/${p.uid}`)}>{u.name}</button>
          <span class="meta" style="display:block">{fmtShort(p.day)}{p.edited ? ` · ${t('Edited')}` : ''}</span>
        </span>
        <WinBadge stats={stats} />
        {!mine && !hideFollow && me && <button class={following ? 'chip-btn on small' : 'chip-btn small'} onClick={() => { toggleFollow(me.uid, p.uid); onChange(); }}>{following ? t('Following') : t('Follow')}</button>}
      </div>

      {p.picks.map((k, i) => {
        const g = gameById(k.game);
        return (
          <div key={i} class="pick" data-game={k.game}>
            <div class="pick-head"><b>{g ? g.name : k.game}</b><span class="pill gold">{t(k.format)}</span><span class="meta" style="margin-left:auto">{t('Draw')} {fmtShort(k.forDate)}</span></div>
            <div class="nums">{k.sets.map((s) => <div key={s} class="chip">{s}</div>)}</div>
          </div>
        );
      })}
      {ev.resolved && <div class={ev.won ? 'res-line won' : 'res-line'}>{ev.won ? t('Matched the result') : t('Did not match the result')}</div>}

      <div class="post-foot">
        <button class={v.mine === 'up' ? 'vote on' : 'vote'} aria-pressed={v.mine === 'up'} onClick={() => { if (!me) { toast(t('Log in to vote')); return; } vote(p.id, 'up'); onChange(); }}>👍 {v.up}%</button>
        <button class={v.mine === 'down' ? 'vote on' : 'vote'} aria-pressed={v.mine === 'down'} onClick={() => { if (!me) { toast(t('Log in to vote')); return; } vote(p.id, 'down'); onChange(); }}>👎 {v.down}%</button>
        {!hideActions && mine && canEdit(p, me.uid) && <button class="chip-btn small" style="margin-left:auto" onClick={() => onEdit(p)}>{t('Edit')}</button>}
        {!hideActions && mine && canDelete(p, me.uid) && <button class="chip-btn small danger" style={canEdit(p, me.uid) ? '' : 'margin-left:auto'} onClick={() => { if (confirm(t('Delete this post?'))) { deletePost(p.id); onChange(); toast(t('Post deleted')); } }}>{t('Delete')}</button>}
      </div>
    </div>
  );
}

export function Composer({ me, edit, onClose, onDone, toast }) {
  const init = edit ? edit.picks.map((k) => ({ game: k.game, format: k.format, sets: [...k.sets] })) : [];
  const [picks, setPicks] = useState(init);
  const [err, setErr] = useState('');
  const has = (id) => picks.some((k) => k.game === id);
  const toggleGame = (id) => {
    if (has(id)) setPicks(picks.filter((k) => k.game !== id));
    else if (picks.length >= MAX_GAMES) setErr('You can choose up to 2 games per post.');
    else { setErr(''); setPicks([...picks, { game: id, format: 'Straight', sets: [''] }]); }
  };
  const upd = (id, patch) => setPicks(picks.map((k) => (k.game === id ? { ...k, ...patch } : k)));
  const setNum = (id, i, val) => { const k = picks.find((x) => x.game === id); const sets = [...k.sets]; sets[i] = val.replace(/\D/g, '').slice(0, 4); upd(id, { sets }); };
  const submit = () => {
    const clean = picks.map((k) => ({ ...k, sets: k.sets.filter((s) => s !== '') }));
    const e = validPicks(clean);
    if (e) { setErr(e); return; }
    if (edit) { editPost(edit.id, clean); toast(t('Post updated')); } else { createPost(me.uid, clean); toast(t('Prediction posted')); }
    onDone();
  };
  return (
    <Sheet title={edit ? t('Edit your prediction') : t('Place your prediction')} onClose={onClose}>
      <div class="meta" style="margin-bottom:8px">{t('Which game is this prediction for? (up to 2)')}</div>
      <div class="chipwrap" style="margin:0 0 12px">
        {GAMES.map((g) => <button key={g.id} class={has(g.id) ? 'chip-btn on' : 'chip-btn'} onClick={() => toggleGame(g.id)}>{SHORT(g.name)}</button>)}
      </div>
      {picks.map((k) => {
        const g = gameById(k.game);
        return (
          <div key={k.game} class="pick" data-game={k.game} style="margin-bottom:12px">
            <div class="pick-head"><b>{g.name}</b></div>
            <div class="meta" style="margin:6px 0 6px">{t('How will you play it?')}</div>
            <div class="chipwrap" style="margin:0 0 10px">
              {FORMATS.map((f) => <button key={f} class={k.format === f ? 'chip-btn on small' : 'chip-btn small'} onClick={() => upd(k.game, { format: f })}>{t(f)}</button>)}
            </div>
            <div class="meta" style="margin-bottom:6px">{t('Your numbers (up to 4)')}</div>
            <div class="numin">
              {k.sets.map((s, i) => (
                <div key={i} class="numin-row">
                  <input class="input big-input" inputMode="numeric" maxLength={4} placeholder="0000" aria-label={`${t('Number')} ${i + 1}`} value={s} onInput={(e) => setNum(k.game, i, e.currentTarget.value)} />
                  {k.sets.length > 1 && <button class="icon-btn" aria-label={t('Remove')} onClick={() => upd(k.game, { sets: k.sets.filter((_, j) => j !== i) })}>×</button>}
                </div>
              ))}
            </div>
            {k.sets.length < MAX_SETS && <button class="chip-btn small" style="margin-top:8px" onClick={() => upd(k.game, { sets: [...k.sets, ''] })}>+ {t('Add number')}</button>}
          </div>
        );
      })}
      <div class="meta" style="font-size:12px;line-height:1.5;margin-bottom:10px">{t('One post per day. You can edit once and delete until 2 PM India time on the day you post.')}</div>
      {err && <div class="form-err" role="alert">{t(err)}</div>}
      <button class="btn" onClick={submit} disabled={!picks.length}>{edit ? t('Save changes') : t('Post prediction')}</button>
    </Sheet>
  );
}

export function Community({ user, data, toast }) {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState('all');
  const [composer, setComposer] = useState(import.meta.env.DEV && location.search.includes('composer') ? {} : null); // null | {} new | {edit}
  const refresh = () => setTick((n) => n + 1);
  const results = data.results;
  const posts = useMemo(() => (results ? allPosts(results) : []), [results, setTick, composer]); // eslint-disable-line
  const statsCache = {};
  const stats = (uid) => { if (!statsCache[uid]) statsCache[uid] = winStats(uid, results); return statsCache[uid]; };

  if (!user) return (<div><AppBar title={t('Community')} tagline={t('Share your predictions')} go={go} /><Locked onLogin={() => go('/login')} text={t('Log in to share predictions and follow other players. Guests can still view results and predictions.')} /></div>);
  if (data.status === 'loading' && !data.results) return <Loading />;

  const fresh = allPosts(results);
  const following = followingOf(user.uid);
  const shown = fresh.filter((p) => (tab === 'all' ? true : following.includes(p.uid)));
  const done = postedToday(user.uid);

  return (
    <div>
      <AppBar title={t('Community')} tagline={t('Share your predictions')} go={go} />
      <button class="post-cta" onClick={() => (done ? toast(t('You have already posted today. See your post in Profile.')) : setComposer({}))}>
        <span class="aicon">＋</span>
        <span class="atext"><b>{t('Place your prediction')}</b><small>{done ? t('Posted today. Come back tomorrow.') : t('Choose a game, format and your numbers')}</small></span>
      </button>

      <div class="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'all'} class={tab === 'all' ? 'tab on' : 'tab'} onClick={() => setTab('all')}>{t('All')}</button>
        <button role="tab" aria-selected={tab === 'following'} class={tab === 'following' ? 'tab on' : 'tab'} onClick={() => setTab('following')}>{t('Following')}</button>
      </div>

      {shown.length === 0 && <Panel><div class="empty">{tab === 'following' ? t('Follow players to see their posts here.') : t('No posts yet.')}</div></Panel>}
      {shown.slice(0, 40).map((p) => <PostCard key={p.id} p={p} me={user} results={results} stats={stats(p.uid)} onChange={refresh} toast={toast} onEdit={(x) => setComposer({ edit: x })} />)}

      {composer && <Composer me={user} edit={composer.edit} toast={toast} onClose={() => setComposer(null)} onDone={() => { setComposer(null); refresh(); }} />}
    </div>
  );
}
