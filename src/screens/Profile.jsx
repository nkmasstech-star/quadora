import { useState } from 'preact/hooks';
import { totalDraws } from '../data/store.js';
import { IconUser, IconChevron } from '../icons.jsx';
import { AppBar } from '../ui.jsx';
import { go } from '../App.jsx';

const THEMES = [
  { id: 'light', name: 'Light', bg: '#F3F5FA', card: '#FFFFFF', line: '#D9DFEC', gold: '#E3A82A' },
  { id: 'black', name: 'Black', bg: '#000000', card: '#17171B', line: '#25252B', gold: '#E8B94A' },
  { id: 'charcoal', name: 'Charcoal', bg: '#12100E', card: '#272320', line: '#332E27', gold: '#E8B94A' },
  { id: 'teal', name: 'Teal', bg: '#0B1519', card: '#1A303A', line: '#22404B', gold: '#E8B94A' },
];

export function Profile({ theme, setTheme, data, onSignOut, onRefresh, toast }) {
  const [open, setOpen] = useState(false);
  const updated = data.results && data.results.updated ? data.results.updated.slice(0, 16).replace('T', ' ') : 'No update yet';
  return (
    <div>
      <AppBar title="Profile" tagline="Your account and settings" go={go} />

      <div class="hero plain" style="align-items:center">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar"><IconUser /></div>
          <div>
            <div class="hero-title" style="font-size:20px;margin:0">Guest</div>
            <div class="meta">Log in to save your numbers</div>
          </div>
        </div>
        <button class="hero-pill gold-pill" onClick={() => toast('Accounts arrive in the next update.')}>Log in</button>
      </div>

      <div class="section-title"><h2>Theme</h2></div>
      <div class="themes" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <button key={t.id} role="radio" aria-checked={theme === t.id} class={theme === t.id ? 'theme-opt on' : 'theme-opt'} onClick={() => setTheme(t.id)}>
            <div class="theme-prev" style={`background:${t.bg};border:1px solid ${t.line}`}>
              <i style={`height:12px;width:55%;background:${t.card}`} />
              <i style={`height:18px;width:100%;background:${t.gold}`} />
              <i style={`height:10px;width:80%;background:${t.card}`} />
            </div>
            <div class="theme-name"><span>{t.name}</span>{theme === t.id && <span class="theme-check">✓</span>}</div>
          </button>
        ))}
      </div>

      <div class="section-title"><h2>Data</h2></div>
      <div class="rows">
        <div class="row"><span style="flex:1">Results updated</span><span class="meta">{updated}</span></div>
        <div class="row"><span style="flex:1">Draws stored</span><span class="meta">{totalDraws(data.results)}</span></div>
        <button class="row" onClick={() => { onRefresh(); toast('Refreshing…'); }}><span style="flex:1;color:var(--gold-text);font-weight:700">Refresh data</span></button>
      </div>

      <div class="section-title"><h2>About</h2></div>
      <div class="rows">
        <button class="row" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span style="flex:1">Disclaimer</span>
          <span class="chev" style={open ? 'transform:rotate(90deg)' : ''}><IconChevron /></span>
        </button>
        {open && (
          <div class="row" style="display:block"><div class="meta" style="line-height:1.6">Quadora shows lottery results and statistics for information and entertainment only. It does not sell tickets, accept bets or run any draw, and it is not affiliated with any lottery operator. Predictions are statistical guesses and are not guaranteed. You must be 18 or older.</div></div>
        )}
        <div class="row"><span style="flex:1">Version</span><span class="meta">0.1.0</span></div>
      </div>
      <button class="btn text" style="margin-top:18px" onClick={onSignOut}>Back to start screen</button>
    </div>
  );
}
