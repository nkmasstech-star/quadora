import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';
import { fmtShort } from '../data/games.js';
import { buildAlerts, notifOn } from '../data/alerts.js';

export function Notifications({ user, data }) {
  const list = buildAlerts(user, data.results);
  return (
    <div>
      <BackBar title={t('Notifications')} />
      <Hero kicker={t('Alerts')} title={t('Result alerts')} pill={list.length ? String(list.length) : t('Soon')} plain />
      {user && !notifOn() && <Panel><div class="empty">{t('Notifications are turned off. You can turn them on in Settings.')}</div></Panel>}
      {!user && <Panel><div class="empty">{t('Log in to get alerts for your saved numbers and predictions.')}</div></Panel>}
      {user && list.length === 0 && <Panel><div class="empty">{t('You will be notified here when a result is out for your saved numbers, saved posts and predictions.')}</div></Panel>}
      {notifOn() && list.map((a) => (
        <div key={a.id} class="hit" data-game={a.game}>
          <span class="n" style="font-size:20px">{a.won ? '🎉' : '•'}</span>
          <span style="flex:1"><span style="display:block;font-weight:700;font-size:14px">{t(a.title.replace(/\d{4}/, '{n}'), { n: (a.title.match(/\d{4}/) || [''])[0] })}</span><span class="meta">{a.sub} · {fmtShort(a.date)}</span></span>
        </div>
      ))}
    </div>
  );
}
