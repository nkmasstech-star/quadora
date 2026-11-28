// Badge next to a player's name. Two kinds, one shown (medal first):
// 1) Leaders medal with a trophy: Silver = last week's top 5, Gold = last month's top 5, Diamond = all-time top 5.
// 2) Invite tick: Blue-grey = 3 friends joined from your link, Blue = 10 friends.
// Your own profile shows a faint outline tick until you earn one; tapping it explains both.
import { useState } from 'preact/hooks';
import { t } from './i18n.js';
import { Sheet } from './ui.jsx';
import { C } from './data/cloud.js';
import { medalMap } from './data/community.js';
import { refsOf, tickOf, nextTick } from './data/referral.js';
import { shareText } from './data/share.js';

const MED = {
  silver: { hi: '#FFFFFF', a: '#E3E7EC', b: '#A9B1BB', c: '#6E7782', e1: '#FFFFFF', e2: '#8C949E', e3: '#E9ECEF', r1: '#5B6B85', r2: '#2F3A4F', name: 'Silver medal', how: 'Weekly top 5' },
  gold: { hi: '#FFF6CC', a: '#FFD54A', b: '#E09A10', c: '#9A5F00', e1: '#FFF3B0', e2: '#B07400', e3: '#FFE07A', r1: '#D23A2A', r2: '#8E1E12', name: 'Gold medal', how: 'Monthly top 5' },
  diamond: { hi: '#D6F3FF', a: '#3FA9F5', b: '#0D4FB8', c: '#062A6E', e1: '#CFEFFF', e2: '#0A3C94', e3: '#8FD3FF', r1: '#2A3F9E', r2: '#141F5C', name: 'Diamond medal', how: 'All-time top 5' },
};
let gid = 0;
export function MedalIcon({ kind, size = 18 }) {
  const m = MED[kind]; const id = `md${kind}${(gid += 1)}`;
  return (
    <svg width={size * 0.84} height={size} viewBox="0 0 40 48" aria-hidden="true" style="flex:none;vertical-align:-4px">
      <defs>
        <radialGradient id={`${id}f`} cx=".35" cy=".3" r=".8"><stop offset="0" stop-color={m.hi} /><stop offset=".33" stop-color={m.a} /><stop offset=".7" stop-color={m.b} /><stop offset="1" stop-color={m.c} /></radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color={m.e1} /><stop offset=".5" stop-color={m.e2} /><stop offset="1" stop-color={m.e3} /></linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color={m.r1} /><stop offset="1" stop-color={m.r2} /></linearGradient>
      </defs>
      <path d="M10 24L4.5 44l6.5-3.2 4 5.6L19 31z" fill={`url(#${id}r)`} />
      <path d="M30 24l5.5 20-6.5-3.2-4 5.6L21 31z" fill={`url(#${id}r)`} />
      <circle cx="20" cy="18" r="16.5" fill={`url(#${id}e)`} />
      <circle cx="20" cy="18" r="14" fill={`url(#${id}f)`} />
      <circle cx="20" cy="18" r="11.3" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="1.6 1.4" />
      <path d="M8.5 12.5A13 13 0 0 1 25 5.6" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" />
      <path fill="#fff" d="M14.2 10h11.6v4.2a5.8 5.8 0 0 1-4.3 5.6v2.6h2.6v2.4h-8.2v-2.4h2.6v-2.6a5.8 5.8 0 0 1-4.3-5.6z" />
      <path fill="none" stroke="#fff" stroke-width="1.5" d="M14.3 11.6h-2.1v1.4a3.2 3.2 0 0 0 3 3.2M25.7 11.6h2.1v1.4a3.2 3.2 0 0 1-3 3.2" />
      <path d="M33 4.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff" />
      <path d="M6 27l.6 1.5 1.5.6-1.5.6L6 31.2l-.6-1.5-1.5-.6 1.5-.6z" fill="#fff" opacity=".9" />
    </svg>
  );
}
const TFILL = { bluegrey: '#9DB4C8', blue: '#1565D8' };
export function TickIcon({ kind = 'none', size = 16 }) {
  const none = kind === 'none';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style="flex:none;vertical-align:-3px">
      <circle cx="12" cy="12" r="10.5" fill={none ? 'none' : TFILL[kind]} stroke={none ? '#B4B2A9' : 'none'} stroke-width="1.4" />
      <path d="M7.4 12.3l3.1 3.1 6.1-6.3" fill="none" stroke={none ? '#B4B2A9' : '#fff'} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export const medalOf = (uid) => (import.meta.env.DEV && window.__medalDemo && window.__medalDemo[uid]) || medalMap(C.results)[uid] || null;

function BadgeInfo({ uid, own, me, toast, onClose }) {
  const medal = medalOf(uid); const n = refsOf(uid); const tk = tickOf(n); const nt = nextTick(n);
  return (
    <Sheet title={t('Badges')} onClose={onClose}>
      <div class="bi-h">🏆 {t('Leaders medal')}</div>
      <div class="meta bi-p">{t('Be in the top 5 on the Leaders board. Kept until the next week or month is finished.')}</div>
      <div class="bi-grid">
        {['silver', 'gold', 'diamond'].map((k) => <div key={k} class={medal === k ? 'bi-cell on' : 'bi-cell'}><MedalIcon kind={k} size={46} /><b>{t(MED[k].name.replace(' medal', ''))}</b><small>{t(MED[k].how)}</small></div>)}
      </div>
      <div class="bi-h" style="margin-top:14px">✔️ {t('Invite tick')}</div>
      <div class="meta bi-p">{t('Share your invite link. When friends install Q Spot from it and log in, you get a tick next to your name.')}</div>
      <div class="bi-grid two">
        <div class={tk && tk.kind === 'bluegrey' ? 'bi-cell on' : 'bi-cell'}><TickIcon kind="bluegrey" size={34} /><b>{t('Blue-grey tick')}</b><small>{t('{n} friends join', { n: 3 })}</small></div>
        <div class={tk && tk.kind === 'blue' ? 'bi-cell on' : 'bi-cell'}><TickIcon kind="blue" size={34} /><b>{t('Blue tick')}</b><small>{t('{n} friends join', { n: 10 })}</small></div>
      </div>
      {own && <div class="meta" style="margin:10px 2px 0;font-size:12.5px">{nt ? t('{n} joined so far · {k} more for {b}', { n, k: nt.min - n, b: t(nt.name) }) : t('{n} joined so far. Top tick reached!', { n })}</div>}
      {own && <button class="btn" style="margin-top:12px" onClick={() => shareText(t('I use Q Spot 4D for 4D results, analysis and daily predictions. Try it free!'), { uid: me.uid, toast })}>{t('Share my invite link')}</button>}
    </Sheet>
  );
}

// medal wins over tick; own profile shows the outline tick when there is nothing yet
export function Tick({ uid, size = 15, own, me, toast, tap }) {
  const [open, setOpen] = useState(false);
  const medal = medalOf(uid);
  const tk = tickOf(refsOf(uid));
  if (!medal && !tk && !own) return null;
  const icon = medal ? <MedalIcon kind={medal} size={size + 6} /> : <TickIcon kind={tk ? tk.kind : 'none'} size={size} />;
  const label = medal ? t(MED[medal].name) : tk ? t(tk.name) : t('Badges');
  if (!tap && !own) return <span class="vtick" title={label}>{icon}</span>;
  return (
    <span class="vtick">
      <button class="plain-btn" style="padding:2px;line-height:0" aria-label={label} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{icon}</button>
      {open && <BadgeInfo uid={uid} own={own} me={me} toast={toast} onClose={() => setOpen(false)} />}
    </span>
  );
}
