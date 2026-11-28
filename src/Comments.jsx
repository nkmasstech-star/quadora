// Comments sheet for a post: comments, replies (one level; replying to a reply keeps it under the same comment
// with @name), report, delete. All safety checks run in data/comments.js and again in firestore.rules.
import { useState, useEffect } from 'preact/hooks';
import { Sheet } from './ui.jsx';
import { t } from './i18n.js';
import { go } from './App.jsx';
import { Avatar } from './avatars.jsx';
import { Tick } from './Tick.jsx';
import { C } from './data/cloud.js';
import { userInfo, blockedOf } from './data/community.js';
import { watchComments, addComment, deleteComment, reportComment, threads, canDeleteComment, commentBlock } from './data/comments.js';
import { COMMENT_MAX } from './data/textguard.js';

const ago = (ms) => { const m = Math.floor((Date.now() - ms) / 60000); if (m < 1) return t('now'); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

function Item({ c, post, me, onReply, toast, small }) {
  const u = userInfo(c.uid, me);
  const mine = c.uid === me.uid;
  return (
    <div class={small ? 'cm-item reply' : 'cm-item'}>
      <button class="plain-btn" onClick={() => go(mine ? '/profile' : `/user/${c.uid}`)}><Avatar id={u.avatar} uid={c.uid} size={small ? 28 : 34} /></button>
      <div class="cm-body">
        <div class="cm-bubble"><b>{u.name}</b><Tick uid={c.uid} size={12} /><span class="cm-text">{c.text}</span></div>
        <div class="cm-acts">
          <span>{ago(c.at)}</span>
          <button class="link-btn" onClick={() => onReply(c)}>{t('Reply')}</button>
          {!mine && <button class="link-btn" onClick={async () => { if (!confirm(t('Report this comment?'))) return; const r = await reportComment(me, post, c); toast(r.error ? t(r.error) : t('Thanks. Comment reported.')); }}>{t('Report')}</button>}
          {canDeleteComment(me, post, c) && <button class="link-btn danger" onClick={async () => { if (!confirm(t('Delete this comment?'))) return; const r = await deleteComment(post, c); if (r.error) toast(t(r.error)); }}>{t('Delete')}</button>}
        </div>
      </div>
    </div>
  );
}

export function CommentsSheet({ post, me, onClose, toast }) {
  const [text, setText] = useState('');
  const [reply, setReply] = useState(null); // { top, to }
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const off = watchComments(post.id); const h = () => tick((n) => n + 1); window.addEventListener('qd-data', h); return () => { off(); window.removeEventListener('qd-data', h); }; }, [post.id]);
  const list = threads(post.id, blockedOf(me.uid));
  const loaded = !!C.comments[post.id];
  const blocked = commentBlock(me.uid);
  const startReply = (top, to) => { setReply({ top, to }); const n = userInfo(to.uid, me).name; if (to.id !== top.id && !text.startsWith('@')) setText(`@${n} `); setErr(''); };
  const send = async () => {
    setBusy(true); setErr('');
    const r = await addComment(me, post, text, reply ? reply.top : null);
    setBusy(false);
    if (r.error) { setErr(t(r.error, { d: r.d })); return; }
    setText(''); setReply(null);
  };
  return (
    <Sheet title={t('Comments')} onClose={onClose}>
      <div class="cm-list">
        {!loaded && <div class="meta" style="text-align:center;padding:16px">{t('Loading…')}</div>}
        {loaded && list.length === 0 && <div class="meta" style="text-align:center;padding:16px">{t('No comments yet. Be the first!')}</div>}
        {list.map(({ c, replies }) => (
          <div key={c.id}>
            <Item c={c} post={post} me={me} toast={toast} onReply={(x) => startReply(c, x)} />
            {replies.map((r) => <Item key={r.id} c={r} post={post} me={me} toast={toast} small onReply={(x) => startReply(c, x)} />)}
          </div>
        ))}
      </div>
      <div class="cm-compose">
        {reply && <div class="cm-replying">{t('Replying to {n}', { n: userInfo(reply.to.uid, me).name })}<button class="link-btn" onClick={() => { setReply(null); setText(''); }}>✕</button></div>}
        {blocked ? <div class="form-err">{t(blocked.key, { d: blocked.d })}</div> : (
          <div class="cm-row">
            <textarea class="input cm-input" rows={1} maxLength={COMMENT_MAX} placeholder={reply ? t('Write a reply…') : t('Write a comment…')} value={text} onInput={(e) => { setText(e.currentTarget.value.slice(0, COMMENT_MAX)); setErr(''); }} />
            <button class="btn cm-send" disabled={busy || !text.trim()} onClick={send}>{busy ? '…' : t('Send')}</button>
          </div>
        )}
        {err && <div class="form-err" role="alert" style="margin-top:6px">{err}</div>}
        {!blocked && <div class="meta cm-rule">{text.length}/{COMMENT_MAX} · {t('No phone numbers, links or payment requests.')}</div>}
      </div>
    </Sheet>
  );
}
