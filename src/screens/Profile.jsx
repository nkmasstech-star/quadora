import { useState } from 'preact/hooks';
import { totalDraws } from '../data/store.js';
import { IconUser, IconChevron } from '../icons.jsx';
import { AppBar } from '../ui.jsx';
import { go } from '../App.jsx';
import { t, LANGS, getLang } from '../i18n.js';

const THEMES = [
  { id: 'light', name: 'Light', bg: '#F3F5FA', card: '#FFFFFF', line: '#D9DFEC', gold: '#E3A82A' },
  { id: 'black', name: 'Black', bg: '#000000', card: '#17171B', line: '#25252B', gold: '#E8B94A' },
  { id: 'charcoal', name: 'Charcoal', bg: '#12100E', card: '#272320', line: '#332E27', gold: '#E8B94A' },
  { id: 'teal', name: 'Teal', bg: '#0B1519', card: '#1A303A', line: '#22404B', gold: '#E8B94A' },
];

export function Profile({ theme, setTheme, setLang, data, onSignOut, onRefresh, toast }) {
  const [open, setOpen] = useState(false);
  const updated = data.results && data.results.updated ? data.results.updated.slice(0, 16).replace('T', ' ') : t('No update yet');
  return (
    <div>
      <AppBar title={t('Profile')} tagline={t('Your account and settings')} go={go} />

      <div class="hero plain" style="align-items:center">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar"><IconUser /></div>
          <div>
            <div class="hero-title" style="font-size:20px;margin:0">{t('Guest')}</div>
            <div class="meta">{t('Log in to save your numbers')}</div>
          </div>
        </div>
        <button class="hero-pill gold-pill" onClick={() => toast(t('Accounts arrive in the next update.'))}>{t('Log in')}</button>
      </div>

      <div class="rows">
        <div class="row" role="radiogroup" aria-label={t('Theme')}>
          <span style="flex:1">{t('Theme')}</span>
          <span class="swatches">
            {THEMES.map((th) => (
              <button key={th.id} role="radio" aria-checked={theme === th.id} aria-label={t(th.name)} title={t(th.name)} class={theme === th.id ? 'swatch on' : 'swatch'} onClick={() => setTheme(th.id)} style={`background:${th.bg};border-color:${th.line}`}>
                <i style={`background:${th.gold}`} />
              </button>
            ))}
          </span>
        </div>
      </div>

      <div class="rows">
        <div class="row" style="display:block">
          <div style="margin-bottom:10px">{t('Language')}</div>
          <div class="langrow" style="margin:0">
            {LANGS.map(([k, n]) => <button key={k} class={getLang() === k ? 'chip-btn on' : 'chip-btn'} onClick={() => setLang(k)}>{n}</button>)}
          </div>
        </div>
      </div>

      <div class="section-title"><h2>{t('Data')}</h2></div>
      <div class="rows">
        <div class="row"><span style="flex:1">{t('Results updated')}</span><span class="meta">{updated}</span></div>
        {data.results && data.results.dummy && <div class="row"><span style="flex:1">Data</span><span class="meta" style="color:var(--gold-text);font-weight:700">Demo (test)</span></div>}
        <div class="row"><span style="flex:1">{t('Draws stored')}</span><span class="meta">{totalDraws(data.results)}</span></div>
        <button class="row" onClick={() => { onRefresh(); toast(t('Refreshing…')); }}><span style="flex:1;color:var(--gold-text);font-weight:700">{t('Refresh data')}</span></button>
      </div>

      <div class="section-title"><h2>{t('About')}</h2></div>
      <div class="rows">
        <button class="row" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span style="flex:1">{t('Disclaimer')}</span>
          <span class="chev" style={open ? 'transform:rotate(90deg)' : ''}><IconChevron /></span>
        </button>
        {open && (
          <div class="row" style="display:block"><div class="meta" style="line-height:1.6">{t('Quadora shows lottery results and statistics for information and entertainment only. It does not sell tickets, accept bets or run any draw, and it is not affiliated with any lottery operator. Predictions are statistical guesses and are not guaranteed. You must be 18 or older.')}</div></div>
        )}
        <div class="row"><span style="flex:1">{t('Version')}</span><span class="meta">0.1.0 · build {__BUILD__}</span></div>
      </div>
      <button class="btn text" style="margin-top:18px" onClick={onSignOut}>{t('Back to start screen')}</button>
    </div>
  );
}
