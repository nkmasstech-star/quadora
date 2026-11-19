import { useState } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { t } from '../i18n.js';
import { Logo } from '../icons.jsx';
import { DOCS } from './Legal.jsx';

// Shown once, before login. The user must accept the Disclaimer and Privacy Policy to enter the app.
export function Agree({ onAccept }) {
  const [tab, setTab] = useState('disclaimer');
  const [ok, setOk] = useState(false);
  const d = DOCS[tab];
  const decline = () => { try { CapApp.exitApp(); } catch (e) { /* web */ } };
  return (
    <div class="agree">
      <div class="agree-head"><Logo size={40} /><div><div class="app-title" style="text-align:left;font-size:20px">{t('Before you start')}</div><div class="tagline" style="text-align:left">{t('Please read and accept to continue')}</div></div></div>
      <div class="seg" style="margin:12px 0 10px">
        <button type="button" class={tab === 'disclaimer' ? 'on' : ''} onClick={() => setTab('disclaimer')}>{t('Disclaimer')}</button>
        <button type="button" class={tab === 'privacy' ? 'on' : ''} onClick={() => setTab('privacy')}>{t('Privacy Policy')}</button>
      </div>
      <div class="agree-doc pcard">
        {d.body.map(([h, p]) => (
          <div key={h} style="margin-bottom:14px"><div style="font-weight:700;margin-bottom:3px">{h}</div><div class="meta" style="line-height:1.6;font-size:13.5px">{p}</div></div>
        ))}
      </div>
      <label class="switch agree-check">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.currentTarget.checked)} />
        {t('I am 18 or older and I have read and agree to the Disclaimer and Privacy Policy.')}
      </label>
      <button class="btn" disabled={!ok} onClick={onAccept}>{t('Agree and continue')}</button>
      <button class="btn text" onClick={decline}>{t('Decline and exit')}</button>
    </div>
  );
}
