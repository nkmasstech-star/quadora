import { useEffect } from 'preact/hooks';
import { t } from '../i18n.js';
import { SplashScreen } from '@capacitor/splash-screen';

export function Splash({ onDone }) {
  // hand over from the native splash only after this screen has painted, so the badge never moves or blinks
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => { try { SplashScreen.hide({ fadeOutDuration: 0 }); } catch (e) { /* web */ } })); }, []);
  useEffect(() => { const id = setTimeout(onDone, 2000); return () => clearTimeout(id); }, []);
  return (
    <div class="splash">
      <div class="splash-logo">
        <i class="splash-glow" />
        <img class="splash-disc" src="img/logo.png" alt="" />
        <img class="splash-emblem" src="img/emblem.png" alt="Nehroopa" />
      </div>
      <div class="splash-name">Q Spot</div>
      <div class="splash-tag">Nehroopa 4D Predictions</div>
      <div class="splash-slogan">{t('Analysis · Results · Predictions')}</div>
    </div>
  );
}
