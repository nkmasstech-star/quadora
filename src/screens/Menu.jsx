import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';

export function Menu({ open, onClose, go, toast }) {
  return (
    <div class={open ? 'drawer-wrap open' : 'drawer-wrap'} aria-hidden={!open}>
      <div class="scrim" onClick={onClose} />
      <aside class="drawer" aria-label={t('Menu')}>
        <div class="drawer-head"><Logo size={40} /><div><div class="app-title" style="text-align:left;font-size:20px">Q Spot 4D</div><div class="tagline" style="text-align:left">{t('4D Analysis · Predictions · Results')}</div></div></div>
        <button class="drawer-item" onClick={() => { onClose(); go('/howto'); }}>{t('How to Play')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/faq'); }}>{t('FAQ')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/feedback'); }}>{t('Feedback')}</button>
        <div class="drawer-sep" />
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/privacy'); }}>{t('Privacy Policy')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/terms'); }}>{t('Terms of Use')}</button>
        <button class="drawer-item" onClick={() => { onClose(); go('/legal/disclaimer'); }}>{t('Disclaimer')}</button>
        <button class="drawer-item" onClick={() => { onClose(); toast(t('Share is coming soon')); }}>{t('Share the app')}</button>
        <button class="drawer-item" onClick={() => { onClose(); toast(t('Rating opens after launch')); }}>{t('Rate the app')}</button>
      </aside>
    </div>
  );
}
