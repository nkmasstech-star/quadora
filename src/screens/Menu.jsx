import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';

const ITEMS = [
  ['/predictions', 'Predictions'],
  ['/home', 'Results'],
  ['/search', 'Number search'],
  ['/lucky', 'Lucky Game Number'],
  ['/winnings', 'Winnings'],
  ['/profile', 'Profile and settings'],
];

export function Menu({ open, onClose, go, toast }) {
  return (
    <div class={open ? 'drawer-wrap open' : 'drawer-wrap'} aria-hidden={!open}>
      <div class="scrim" onClick={onClose} />
      <aside class="drawer" aria-label={t('Menu')}>
        <div class="drawer-head"><Logo size={40} /><div><div class="app-title" style="text-align:left;font-size:20px">Quadora</div><div class="tagline" style="text-align:left">{t('4D Predictions · Results · Analysis')}</div></div></div>
        {ITEMS.map(([p, l]) => <button key={p} class="drawer-item" onClick={() => { onClose(); go(p); }}>{t(l)}</button>)}
        <div class="drawer-sep" />
        <button class="drawer-item" onClick={() => { onClose(); toast(t('Privacy policy link comes before launch')); }}>{t('Privacy policy')}</button>
        <button class="drawer-item" onClick={() => { onClose(); toast(t('Share is coming soon')); }}>{t('Share the app')}</button>
        <button class="drawer-item" onClick={() => { onClose(); toast(t('Rating opens after launch')); }}>{t('Rate the app')}</button>
      </aside>
    </div>
  );
}
