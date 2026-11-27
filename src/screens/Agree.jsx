import { useState } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { t } from '../i18n.js';
import { Logo } from '../icons.jsx';
import { DOCS } from './Legal.jsx';

// Shown once, before login. One simple page: short key points first, then the full Disclaimer, Privacy Policy and Terms in one scroll.
const POINTS = [
  'For information and entertainment only. We do not sell tickets, take bets or pay prizes.',
  'Predictions are guesses. Nobody can predict a lottery draw.',
  'Results are collected from public sources. Always check the official operator.',
  'We use your Google name and email only to run your account. We never sell your data.',
  'You must be 18 or older and follow the laws where you live.',
];

export function Agree({ onAccept }) {
  const [ok, setOk] = useState(false);
  const decline = () => { try { CapApp.exitApp(); } catch (e) { /* web */ } };
  return (
    <div class="agree">
      <div class="agree-head"><Logo size={44} /><div><div class="app-title" style="text-align:left;font-size:20px">{t('Before you start')}</div><div class="tagline" style="text-align:left">{t('Please read and accept to continue')}</div></div></div>
      <div class="agree-doc pcard">
        <div class="agree-points">
          {POINTS.map((p) => <div key={p} class="agree-pt"><i>✓</i><span>{t(p)}</span></div>)}
        </div>
        {['disclaimer', 'privacy', 'terms'].map((k) => (
          <div key={k} class="agree-sec">
            <div class="agree-sec-h">{t(DOCS[k].title)}</div>
            {DOCS[k].body.map(([h, p]) => (
              <div key={h} style="margin-bottom:10px"><div style="font-weight:700;font-size:13.5px;margin-bottom:2px">{t(h)}</div><div class="meta" style="line-height:1.55;font-size:13px">{t(p)}</div></div>
            ))}
          </div>
        ))}
      </div>
      <label class="switch agree-check">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.currentTarget.checked)} />
        {t('I am 18 or older and I agree to the Disclaimer, Privacy Policy and Terms of Use.')}
      </label>
      <button class="btn" disabled={!ok} onClick={onAccept}>{t('Agree and continue')}</button>
      <button class="btn text" onClick={decline}>{t('Decline and exit')}</button>
    </div>
  );
}
