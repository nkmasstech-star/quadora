import { useEffect } from 'preact/hooks';
import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';

export function Splash({ onDone }) {
  useEffect(() => { const id = setTimeout(onDone, 2400); return () => clearTimeout(id); }, []);
  return (
    <div class="splash">
      <div class="splash-logo"><Logo size={144} /></div>
      <div class="splash-name">Q Spot <span>4D</span></div>
      <div class="splash-slogan">{t('4D Analysis · Predictions · Results')}</div>
    </div>
  );
}
