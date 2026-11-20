import { useState } from 'preact/hooks';
import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';
import { googleSignIn } from '../data/account.js';
import { go } from '../App.jsx';

export function Login({ onGuest, onAuth, toast }) {
  const [err, setErr] = useState('');
  // Test mode: creates a demo Google account on this phone. With Firebase this opens the real Google sign-in.
  const google = () => {
    const r = googleSignIn();
    if (r.error) { setErr(r.error); return; }
    toast(t('Test mode: demo Google account'));
    onAuth(r.user);
  };
  return (
    <div class="login">
      <svg class="rings" aria-hidden="true" width="320" height="320" viewBox="0 0 320 320">
        <circle cx="160" cy="160" r="150" fill="none" stroke="#E8B94A" stroke-opacity="0.12" stroke-width="2" />
        <circle cx="160" cy="160" r="110" fill="none" stroke="#E8B94A" stroke-opacity="0.08" stroke-width="2" />
        <circle cx="160" cy="160" r="70" fill="none" stroke="#E8B94A" stroke-opacity="0.06" stroke-width="2" />
      </svg>

      <div class="brand" style="gap:14px">
        <Logo size={52} />
        <div>
          <div class="display" style="font-weight:700;font-size:32px;line-height:1;letter-spacing:-0.5px">Q Spot <span style="color:var(--gold-text)">4D</span></div>
          <div class="sub" style="margin-top:2px">{t('4D Analysis · Predictions · Results')}</div>
        </div>
      </div>

      <div style="margin-top:44px">
        <h1>{t('Welcome')}</h1>
        <p class="sub" style="font-size:14px;margin:6px 0 0;line-height:1.5">
          {t('Continue with your Google account to join the community, play the Lucky Game and unlock full analysis. A new account is created automatically.')}
        </p>
      </div>

      <div style="margin-top:28px;display:flex;flex-direction:column;gap:12px">
        {err && <div class="form-err" role="alert">{t(err)}</div>}
        <button type="button" class="btn" onClick={google}>{t('Continue with Google')}</button>
        <button type="button" class="btn ghost" onClick={onGuest}>{t('Continue as guest')}</button>
        <div class="meta" style="text-align:center;font-size:12px;line-height:1.5">{t('Guests can view predictions and today\'s results only.')}</div>
      </div>

      <div class="legal">
        <p>{t('By continuing you agree to our')} <a href="#/legal/privacy" onClick={(e) => { e.preventDefault(); go('/legal/privacy'); }}>{t('Privacy Policy')}</a>, <a href="#/legal/terms" onClick={(e) => { e.preventDefault(); go('/legal/terms'); }}>{t('Terms of Use')}</a> {t('and')} <a href="#/legal/disclaimer" onClick={(e) => { e.preventDefault(); go('/legal/disclaimer'); }}>{t('Disclaimer')}</a>.</p>
        <p style="color:var(--faint)">{t('For information and entertainment only. Q Spot 4D does not sell tickets or accept bets. 18+')}</p>
      </div>
    </div>
  );
}
