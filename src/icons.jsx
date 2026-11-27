const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.9,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
};

export const IconHome = () => (
  <svg {...base}><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></svg>
);
export const IconSpark = () => (
  <svg {...base}><path d="M12 3l2 5.2L19.5 10 14 12l-2 5.5L10 12 4.5 10 10 8.2z" /><path d="M19 17v4M17 19h4" /></svg>
);
export const IconSearch = () => (
  <svg {...base}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const IconUser = () => (
  <svg {...base}><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
);
export const IconChevron = () => (
  <svg {...base}><path d="M9 6l6 6-6 6" /></svg>
);
export const IconBack = () => (
  <svg {...base}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconShare = () => (
  <svg {...base}><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 11l6.6-4M8.2 13l6.6 4" /></svg>
);
export const IconCalendar = () => (
  <svg {...base}><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></svg>
);

export const Logo = ({ size = 40 }) => (
  <img class="logo-img" src="img/logo.png" alt="Nehroopa logo" width={size} height={size} draggable={false} />
);

export const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconBell = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15L6 17Z" /><path d="M10 21h4" /></svg>
);

export const IconQ = () => (
  <svg width="24" height="24" viewBox="14 14 80 80" aria-hidden="true">
    <circle cx="45" cy="45" r="22" fill="none" stroke="currentColor" stroke-width="7" />
    <path d="M70 54 L74 66 L86 70 L74 74 L70 86 L66 74 L54 70 L66 66 Z" fill="currentColor" style="stroke:var(--icon-cut, var(--nav-bg))" stroke-width="3" />
  </svg>
);
export const IconTrophy = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a1 1 0 0 0-1 1c0 2 1.5 3.5 4 3.5M16 6h3a1 1 0 0 1 1 1c0 2-1.5 3.5-4 3.5" /><path d="M12 13v4M8.5 20h7M10 17h4" /></svg>
);

export const IconBars = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6" /></svg>
);
export const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);

export const IconUsers = () => (
  <svg {...base}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.6-3.3 3.1-5 6-5s5.4 1.7 6 5" /><circle cx="17" cy="9.5" r="2.5" /><path d="M16.5 14.2c2.4-.2 4.1 1.3 4.5 4.3" /></svg>
);

export const IconDice = () => (
  <svg {...base}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /></svg>
);
export const IconLock = () => (
  <svg {...base}><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" /></svg>
);

export const IconGear = () => (
  <svg {...base}><path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h3M11 12h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /><circle cx="9" cy="12" r="0.01" /></svg>
);

export const IconHeart = ({ on }) => (
  <svg {...base} fill={on ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>
);
export const IconBookmark = ({ on }) => (
  <svg {...base} fill={on ? 'currentColor' : 'none'}><path d="M7 4h10v16l-5-3.5L7 20V4z" /></svg>
);
export const IconVote = () => (
  <svg {...base}><rect x="4" y="12" width="4" height="8" rx="1" /><rect x="10" y="5" width="4" height="15" rx="1" /><rect x="16" y="9" width="4" height="11" rx="1" /></svg>
);
