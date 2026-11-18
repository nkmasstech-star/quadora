import { useState } from 'preact/hooks';
import { totalDraws } from '../data/store.js';
import { IconUser, IconChevron } from '../icons.jsx';

export function Profile({ theme, setTheme, data, onSignOut, onRefresh, toast }) {
  const [open, setOpen] = useState(false);
  const updated = data.results && data.results.updated ? data.results.updated.slice(0, 16).replace('T', ' ') : 'No update yet';

  return (
    <div>
      <div class="topbar">
        <div class="title">Profile</div>
      </div>

      <div class="card" style="display:flex;align-items:center;gap:14px;cursor:default">
        <div class="avatar"><IconUser /></div>
        <div style="flex:1">
          <div class="game">Guest</div>
          <div class="meta">Log in to save numbers across devices</div>
        </div>
        <button class="pill gold" onClick={() => toast('Accounts arrive in the next update.')}>Log in</button>
      </div>

      <div class="section-title"><h2>Appearance</h2></div>
      <div class="rows">
        <button class="row" role="switch" aria-checked={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <span style="flex:1">Dark mode</span>
          <span class={theme === 'dark' ? 'toggle on' : 'toggle'} />
        </button>
      </div>

      <div class="section-title"><h2>Data</h2></div>
      <div class="rows">
        <div class="row">
          <span style="flex:1">Results updated</span>
          <span class="meta">{updated}</span>
        </div>
        <div class="row">
          <span style="flex:1">Draws stored</span>
          <span class="meta">{totalDraws(data.results)}</span>
        </div>
        <button class="row" onClick={() => { onRefresh(); toast('Refreshing…'); }}>
          <span style="flex:1;color:var(--gold);font-weight:600">Refresh data</span>
        </button>
      </div>

      <div class="section-title"><h2>About</h2></div>
      <div class="rows">
        <button class="row" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span style="flex:1">Disclaimer</span>
          <span class="chev" style={open ? 'transform:rotate(90deg)' : ''}><IconChevron /></span>
        </button>
        {open && (
          <div class="row" style="display:block">
            <div class="meta" style="line-height:1.6">
              Quadora shows lottery results and statistics for information and entertainment only. It does not sell tickets, accept bets or run any draw, and it is not affiliated with any lottery operator. Predictions are statistical guesses and are not guaranteed. You must be 18 or older.
            </div>
          </div>
        )}
        <div class="row">
          <span style="flex:1">Version</span>
          <span class="meta">0.1.0</span>
        </div>
      </div>

      <button class="btn text" style="margin-top:18px" onClick={onSignOut}>Back to start screen</button>
    </div>
  );
}
