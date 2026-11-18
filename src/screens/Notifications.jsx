import { BackBar, Hero, Panel } from '../ui.jsx';
import { t } from '../i18n.js';

export function Notifications() {
  return (
    <div>
      <BackBar title={t('Notifications')} />
      <Hero kicker={t('Alerts')} title={t('Result alerts')} pill={t('Soon')} plain />
      <Panel><div class="empty">{t('You will be notified here when a new result or prediction is ready.')}</div></Panel>
    </div>
  );
}
