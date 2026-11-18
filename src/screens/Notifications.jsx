import { BackBar, Hero, Panel } from '../ui.jsx';

export function Notifications() {
  return (
    <div>
      <BackBar title="Notifications" />
      <Hero kicker="Alerts" title="Result alerts" pill="Soon" plain />
      <Panel><div class="empty">You will be notified here when a new result or prediction is ready.</div></Panel>
    </div>
  );
}
