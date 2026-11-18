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
  <svg role="img" aria-label="Quadora logo" width={size} height={size} viewBox="14 14 80 80">
    <circle cx="45" cy="45" r="22" fill="none" stroke="#E8B94A" stroke-width="6" />
    <path d="M70 54 L74 66 L86 70 L74 74 L70 86 L66 74 L54 70 L66 66 Z" fill="#E8B94A" stroke="#0A1020" stroke-width="3" />
  </svg>
);
