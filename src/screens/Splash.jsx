import { useEffect } from 'preact/hooks';
import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';
import { SplashScreen } from '@capacitor/splash-screen';

export function Splash({ onDone }) {
  // hand over from the native splash only after this screen has painted, so the logo never moves or blinks
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => { try { SplashScreen.hide({ fadeOutDuration: 0 }); } catch (e) { /* web */ } })); }, []);
  useEffect(() => { const id = setTimeout(onDone, 2400); return () => clearTimeout(id); }, []);
  return (
    <div class="splash">
      <div class="splash-logo"><Logo size={137} /></div>
      <div class="splash-name">Q Spot <span>4D</span></div>
      <div class="splash-slogan">{t('4D Analysis · Predictions · Results')}</div>
    </div>
  );
}
