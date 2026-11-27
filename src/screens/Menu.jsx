import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';
import { PUBLISHER } from '../config.js';
import { openStore, shareApp } from '../data/rate.js';

export function Menu({ open, onClose, go, toast }) {
  return (
    <div class={open ? 'drawer-wrap open' : 'drawer-wrap'} aria-hidden={!open}>
      <div class="scrim" onClick={onClose} />
      <aside class="drawer" aria-label={t('Menu')}>
        <div class="drawer-head"><Logo size={40} /><div><div class="app-title" style="text-align:left;font-size:20px"><span class="hl">Q Spot</span></div><div class="tagline" style="text-align:left;font-weight:700;color:var(--text)">Nehroopa 4D Predictions</div><div class="tagline sub2" style="text-align:left">{t('Analysis · Results · Predictions')}</div></div></div>
        <button class="drawer-item" onClick={() => { onClose(); go('/howto'); }}>{t('How to Play')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/faq'); }}>{t('FAQ')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/feedback'); }}>{t('Feedback')}</button>
        <div class="drawer-sep" />
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/privacy'); }}>{t('Privacy Policy')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/terms'); }}>{t('Terms of Use')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/disclaimer'); }}>{t('Disclaimer')}</button>
        <button class="drawer-item" onClick={() => { onClose(); shareApp(toast); }}>{t('Share the app')}</button>
        <button class="drawer-item" onClick={() => { onClose(); openStore(); }}>{t('Rate the app')}</button>
        <div class="drawer-foot">{t('A product of {b}', { b: PUBLISHER })}</div>
      </aside>
    </div>
  );
}
