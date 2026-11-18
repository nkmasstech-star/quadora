import { Logo } from '../icons.jsx';

const ITEMS = [
  ['/predictions', 'Predictions'],
  ['/home', 'Results'],
  ['/search', 'Number search'],
  ['/winnings', 'Winnings'],
  ['/profile', 'Profile and settings'],
];

export function Menu({ open, onClose, go, toast }) {
  return (
    <div class={open ? 'drawer-wrap open' : 'drawer-wrap'} aria-hidden={!open}>
      <div class="scrim" onClick={onClose} />
      <aside class="drawer" aria-label="Menu">
        <div class="drawer-head"><Logo size={40} /><div><div class="app-title" style="text-align:left;font-size:20px">Quadora</div><div class="tagline" style="text-align:left">4D Predictions · Results · Analysis</div></div></div>
        {ITEMS.map(([p, l]) => <button key={p} class="drawer-item" onClick={() => { onClose(); go(p); }}>{l}</button>)}
        <div class="drawer-sep" />
        <button class="drawer-item" onClick={() => { onClose(); toast('Privacy policy link comes before launch'); }}>Privacy policy</button>
        <button class="drawer-item" onClick={() => { onClose(); toast('Share is coming soon'); }}>Share the app</button>
        <button class="drawer-item" onClick={() => { onClose(); toast('Rating opens after launch'); }}>Rate the app</button>
      </aside>
    </div>
  );
}
