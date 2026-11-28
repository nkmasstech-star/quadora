// Round verified tick next to a player's name, earned by inviting friends:
// Silver (3 friends) yellow, Gold (5) blue, Platinum (10) dark blue with a glowing ring. White tick inside.
// On your own profile a faint grey tick shows until you earn one; tapping it explains how.
import { useState } from 'preact/hooks';
import { t } from './i18n.js';
import { Sheet } from './ui.jsx';
import { refsOf, tickOf, nextTick, TICKS } from './data/referral.js';
import { shareText } from './data/share.js';

const FILL = { none: '#9AA0A6', silver: '#F5B400', gold: '#1D9BF0', platinum: '#0A3A8C' };
export function TickIcon({ kind = 'none', size = 16 }) {
  const plat = kind === 'platinum';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={`flex:none;vertical-align:-3px;${kind === 'none' ? 'opacity:.38' : ''}`}>
      {plat && <circle cx="12" cy="12" r="11.2" fill="none" stroke="#7DB8FF" stroke-width="1.6" />}
      <circle cx="12" cy="12" r={plat ? 9 : 11} fill={FILL[kind]} />
      <path fill="none" stroke="#fff" stroke-width={plat ? 2.2 : 2.5} stroke-linecap="round" stroke-linejoin="round" d={plat ? 'M8.3 12.2l2.6 2.6 4.9-5.1' : 'M7.4 12.3l3.1 3.1 6-6.3'} />
    </svg>
  );
}

// how ticks work (+ share button on your own profile)
export function TickInfo({ uid, own, me, toast, onClose }) {
  const n = refsOf(uid); const cur = tickOf(n); const nt = nextTick(n);
  return (
    <Sheet title={t('Verified tick')} onClose={onClose}>
      <div class="meta" style="line-height:1.5;margin-bottom:12px">{t('Share your invite link. When friends install Q Spot from it and log in, you earn a tick next to your name.')}</div>
      {[...TICKS].reverse().map((x) => (
        <div key={x.kind} class={cur && cur.kind === x.kind ? 'tk-row on' : 'tk-row'}>
          <TickIcon kind={x.kind} size={30} />
          <span style="flex:1"><b>{t(x.name)}</b><small>{t('{n} friends join', { n: x.min })}</small></span>
          {cur && cur.kind === x.kind && <span class="pill gold">{t('Yours')}</span>}
        </div>
      ))}
      {own && <div class="meta" style="margin:12px 2px 0;font-size:12.5px">{nt ? t('{n} joined so far · {k} more for {b}', { n, k: nt.min - n, b: t(nt.name) }) : t('{n} joined so far. Top tick reached!', { n })}</div>}
      {own && <button class="btn" style="margin-top:12px" onClick={() => shareText(t('I use Q Spot 4D for 4D results, analysis and daily predictions. Try it free!'), { uid: me.uid, toast })}>{t('Share my invite link')}</button>}
    </Sheet>
  );
}

// own: show the faint grey tick when none is earned yet, and open the explainer on tap
export function Tick({ uid, size = 15, own, me, toast, tap }) {
  const [open, setOpen] = useState(false);
  const k = tickOf(refsOf(uid));
  if (!k && !own) return null;
  const icon = <TickIcon kind={k ? k.kind : 'none'} size={size} />;
  if (!tap && !own) return <span class="vtick" title={t(k.name)}>{icon}</span>;
  return (
    <span class="vtick">
      <button class="plain-btn" style="padding:2px;line-height:0" aria-label={t('Verified tick')} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{icon}</button>
      {open && <TickInfo uid={uid} own={own} me={me} toast={toast} onClose={() => setOpen(false)} />}
    </span>
  );
}
