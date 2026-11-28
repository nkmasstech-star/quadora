import { useState, useEffect } from 'preact/hooks';
import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';
import { go } from '../App.jsx';
import { buildAlerts, notifOn, alertTitle, ago } from '../data/alerts.js';
import { inboxOf, markInboxRead, seenOf, markSeen, addTestInbox } from '../data/inbox.js';
import { TEST_MODE } from '../config.js';
import { fmtShort } from '../data/games.js';

const SOCIAL = {
  like: ['❤️', '{n} liked your post'],
  share: ['↗️', '{n} shared your post'],
  follow: ['👤', '{n} started following you'],
  challenge: ['⚔️', '{n} called a group challenge'], group: ['👥', '{n} added you to a group'],
};
const ANN = { results: '🔔', predictions: '✨', update: '⬆️' };

export function Notifications({ user, data }) {
  const [, again] = useState(0);
  // snapshot taken when the page opens, so "new" items stay highlighted while you read them
  const [snap] = useState(() => ({ seen: new Set(user ? seenOf(user.uid) : []), social: user ? inboxOf(user.uid).filter((x) => !x.read).map((x) => x.id) : [] }));
  const alerts = buildAlerts(user, data.results);
  const anns = (data && data.announcements) || [];
  const social = user ? inboxOf(user.uid) : [];

  useEffect(() => {
    if (!user) return;
    markInboxRead(user.uid);
    markSeen(user.uid, [...alerts.map((a) => a.id), ...anns.map((a) => a.id)]);
  }, [user && user.uid, alerts.length, anns.length, social.length]);

  const items = [
    ...social.map((x) => ({ id: x.id, at: x.at, icon: (SOCIAL[x.type] || SOCIAL.like)[0], title: t((SOCIAL[x.type] || SOCIAL.like)[1], { n: x.from }), sub: ago(x.at), isNew: snap.social.includes(x.id), go: x.type === 'follow' ? `/user/${x.fromUid}` : (x.type === 'group' || x.type === 'challenge') && x.postId ? `/group/${String(x.postId).slice(0, 6)}` : '/community' })),
    ...alerts.map((a) => ({ id: a.id, at: Date.parse(a.date) || 0, icon: a.won ? '🎉' : '•', title: alertTitle(a), sub: `${a.sub} · ${fmtShort(a.date)}`, isNew: !snap.seen.has(a.id), game: a.game, go: '/winnings' })),
    ...anns.map((a) => ({ id: a.id, at: Date.parse(a.at) || 0, icon: ANN[a.type] || '🔔', title: t(a.title), sub: t(a.body), isNew: !snap.seen.has(a.id), go: a.type === 'results' ? '/home' : a.type === 'predictions' ? '/predictions' : null })),
  ].sort((a, b) => b.at - a.at);

  const test = () => {
    const k = Date.now();
    addTestInbox(user.uid, { type: 'follow', from: 'Aisha', fromUid: 'test-a', postId: `f${k}` });
    addTestInbox(user.uid, { type: 'share', from: 'Kumar', fromUid: 'test-b', postId: `s${k}` });
    addTestInbox(user.uid, { type: 'like', from: 'Mei Ling', fromUid: 'test-c', postId: `l${k}` });
    again((n) => n + 1);
  };

  return (
    <div>
      <BackBar title={t('Notifications')} />
      <Hero kicker={t('Alerts')} title={t('Your notifications')} pill={items.length ? String(items.length) : t('Soon')} plain />
      {user && !notifOn() && <Panel><div class="empty">{t('Notifications are turned off. You can turn them on in Settings.')}</div></Panel>}
      {!user && <Panel><div class="empty">{t('Log in to get alerts for your saved numbers and predictions.')}</div></Panel>}
      {user && items.length === 0 && <Panel><div class="empty">{t('You will be notified here for likes, shares, follows, results and wins.')}</div></Panel>}
      {user && TEST_MODE && <button class="btn ghost" style="margin-top:12px;height:44px" onClick={test}>{t('Test: send sample notifications')}</button>}
      {notifOn() && items.map((a) => (
        <button key={a.id} class={a.isNew ? 'hit nitem new' : 'hit nitem'} data-game={a.game} style="width:100%;text-align:left" onClick={() => a.go && go(a.go)}>
          <span class="n" style="font-size:20px">{a.icon}</span>
          <span style="flex:1;min-width:0"><span style="display:block;font-weight:700;font-size:14px">{a.title}</span><span class="meta">{a.sub}</span></span>
          {a.isNew && <i class="ndot" />}
        </button>
      ))}
    </div>
  );
}
