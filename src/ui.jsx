export function Tile({ rank, number, first }) {
  return (
    <div class={first ? 'tile first' : 'tile'}>
      <span class="rank">{rank}</span>
      <span class="num">{number || '----'}</span>
    </div>
  );
}

export function Top3({ draw }) {
  return (
    <div class="top3">
      <Tile rank={t('1ST')} number={draw.first} first />
      <Tile rank={t('2ND')} number={draw.second} />
      <Tile rank={t('3RD')} number={draw.third} />
    </div>
  );
}

export function NumberGrid({ numbers }) {
  const list = numbers || [];
  return (
    <div class="nums">
      {list.map((n, i) => (
        <div key={i} class={n && /^\d{4}$/.test(n) ? 'chip' : 'chip dash'}>{n && /^\d{4}$/.test(n) ? n : '----'}</div>
      ))}
    </div>
  );
}

export function Loading() {
  return <div class="loading">{t('Loading…')}</div>;
}

import { IconMenu, IconBell, IconBack, Logo } from './icons.jsx';
import { t } from './i18n.js';
import { useBadge } from './data/inbox.js';

export const openMenu = () => window.dispatchEvent(new Event('qd-menu'));

export function AppBar({ title, tagline, sub, go, right }) {
  return (
    <div class="app-bar">
      <button class="icon-btn" aria-label={t('Menu')} onClick={openMenu}><IconMenu /></button>
      <div>
        <div class="app-title">{title}</div>
        {tagline && <div class="tagline">{tagline}</div>}
        {sub && <div class="tagline sub2">{sub}</div>}
      </div>
      {right || <button class="icon-btn bell" aria-label={t('Notifications')} onClick={() => go('/notifications')}><IconBell />{useBadge() > 0 && <i class="dot" />}</button>}
    </div>
  );
}

export function BackBar({ title, right }) {
  return (
    <div class="app-bar">
      <button class="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><IconBack /></button>
      <div class="app-title" style="font-size:18px">{title}</div>
      <div style="display:flex;justify-content:flex-end">{right}</div>
    </div>
  );
}

export function Hero({ kicker, title, pill, plain, children }) {
  return (
    <div class={plain ? 'hero plain' : 'hero'}>
      <div class="hero-text">
        {kicker && <div class="hero-kicker">{kicker}</div>}
        <div class="hero-title">{title}</div>
        {children}
      </div>
      {pill && <span class="hero-pill">{pill}</span>}
    </div>
  );
}

export function Panel({ title, action, children }) {
  return (
    <div class="pcard">
      {(title || action) && (
        <div class="pcard-head"><span>{title}</span>{action}</div>
      )}
      {children}
    </div>
  );
}

import { createPortal } from 'preact/compat';
import { IconLock } from './icons.jsx';

export function Locked({ title, text, onLogin, onBack }) {
  return (
    <div class="lock">
      <span class="lock-ic"><IconLock /></span>
      <div class="lock-title">{title || t('Members only')}</div>
      <div class="meta" style="line-height:1.55;max-width:290px">{text || t('Log in to unlock this. Guests can view predictions and the latest results.')}</div>
      <button class="btn" style="margin-top:18px;max-width:260px" onClick={onLogin}>{t('Log in or sign up')}</button>
      {onBack && <button class="btn text" style="margin-top:4px;max-width:260px" onClick={onBack}>{t('Back')}</button>}
    </div>
  );
}

// Bottom sheet rendered outside the animated page wrapper so it always covers the full screen.
export function Sheet({ title, onClose, children }) {
  return createPortal(
    <div class="sheet-wrap">
      <div class="sheet-scrim" onClick={onClose} />
      <div class="sheet" role="dialog" aria-label={title}>
        <div class="sheet-head"><div class="sheet-title">{title}</div><button class="icon-btn" aria-label={t('Close')} onClick={onClose}>×</button></div>
        <div class="sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Shown under Singapore results instead of an ad: a small, quiet credit line (still readable) with a "not official" note.
export function SourceCredit({ name, site }) {
  return (
    <div role="note" style="margin:14px 4px 0;opacity:.6">
      <div class="meta" style="font-size:11px;line-height:1.45">
        <b>{t('Results source')}:</b> {t('Shown here as an extra convenience for you. These results belong to {n}. This is not the official result and this app is not connected with {n}. Please check the official site ({s}) before you act on any result.', { n: name, s: site })}
      </div>
    </div>
  );
}

// Nehroopa brand card: logo + name + line. "small" fits next to a tab.
export function NehroopaCard({ small }) {
  return (
    <div class={small ? 'nr-card small' : 'nr-card'}>
      <Logo size={small ? 30 : 42} />
      <div class="nr-text">
        <b>Nehroopa <em>4D</em> Predictions</b>
        <small>{t('Results · Analysis · Predictions')}</small>
      </div>
    </div>
  );
}
