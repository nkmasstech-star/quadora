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
      <Tile rank="1ST" number={draw.first} first />
      <Tile rank="2ND" number={draw.second} />
      <Tile rank="3RD" number={draw.third} />
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
  return <div class="loading">Loading…</div>;
}

import { IconMenu, IconBell, IconBack } from './icons.jsx';

export const openMenu = () => window.dispatchEvent(new Event('qd-menu'));

export function AppBar({ title, tagline, go }) {
  return (
    <div class="app-bar">
      <button class="icon-btn" aria-label="Menu" onClick={openMenu}><IconMenu /></button>
      <div>
        <div class="app-title">{title}</div>
        {tagline && <div class="tagline">{tagline}</div>}
      </div>
      <button class="icon-btn bell" aria-label="Notifications" onClick={() => go('/notifications')}><IconBell /><i class="dot" /></button>
    </div>
  );
}

export function BackBar({ title, right }) {
  return (
    <div class="app-bar">
      <button class="icon-btn" aria-label="Back" onClick={() => history.back()}><IconBack /></button>
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
