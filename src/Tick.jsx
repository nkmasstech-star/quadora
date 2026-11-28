// Verified-style tick shown next to a player's name for friends invited: blue (3), gold (5), crown (10).
import { t } from './i18n.js';
import { refsOf, tickOf } from './data/referral.js';

const COL = { blue: ['#1D9BF0', '#1D9BF0'], gold: ['#F5C542', '#D99A0B'], crown: ['#1D9BF0', '#F5C542'] };
export function TickIcon({ kind, size = 16 }) {
  const [fill, ring] = COL[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style="flex:none;vertical-align:-3px">
      <path fill={fill} stroke={kind === 'blue' ? 'none' : ring} stroke-width={kind === 'blue' ? 0 : 1.6} d="M12 1.6l2.5 1.9 3.1-.2 1 3 2.6 1.8-.9 3 .9 3-2.6 1.8-1 3-3.1-.2L12 22.4l-2.5-1.9-3.1.2-1-3-2.6-1.8.9-3-.9-3 2.6-1.8 1-3 3.1.2z" />
      <path fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7.6 12.3l3 3 5.8-6" />
      {kind === 'crown' && <path fill="#F5C542" stroke="#B57F00" stroke-width=".8" d="M7 1.2l2 1.6L12 0l3 2.8 2-1.6-.7 3.1H7.7z" transform="translate(0 -0.4)" />}
    </svg>
  );
}
export function Tick({ uid, size, label }) {
  const k = tickOf(refsOf(uid));
  if (!k) return null;
  return <span class="vtick" title={t(k.name)}><TickIcon kind={k.kind} size={size} />{label && <b>{t(k.name)}</b>}</span>;
}
