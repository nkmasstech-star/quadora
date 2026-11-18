import { useState } from 'preact/hooks';
import { Logo } from '../icons.jsx';
import { t, LANGS, getLang } from '../i18n.js';

export function Login({ onGuest, toast, setLang }) {
  const [signup, setSignup] = useState(false);
  const [show, setShow] = useState(false);

  const soon = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    toast(t('Accounts arrive in the next update. You can continue as a guest for now.'));
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
          <div class="display" style="font-weight:700;font-size:34px;line-height:1;letter-spacing:-0.5px">Quadora</div>
          <div class="sub" style="margin-top:2px">{t('4D results · Analysis · History')}</div>
        </div>
      </div>

      <div class="langrow">
        {LANGS.map(([k, n]) => <button key={k} type="button" class={getLang() === k ? 'chip-btn on' : 'chip-btn'} onClick={() => setLang(k)}>{n}</button>)}
      </div>

      <div style="margin-top:22px">
        <h1>{signup ? t('Create your account') : t('Welcome back')}</h1>
        <p class="sub" style="font-size:14px;margin:6px 0 0;line-height:1.5">
          {t('Log in to save your favourite numbers and see your history on every device.')}
        </p>
      </div>

      <div class="seg" style="margin-top:22px">
        <button type="button" class={signup ? '' : 'on'} aria-pressed={!signup} onClick={() => setSignup(false)}>{t('Log in')}</button>
        <button type="button" class={signup ? 'on' : ''} aria-pressed={signup} onClick={() => setSignup(true)}>{t('Sign up')}</button>
      </div>

      <form onSubmit={soon} style="margin-top:20px;display:flex;flex-direction:column;gap:14px">
        {signup && (
          <div class="field">
            <label for="name">{t('Name')}</label>
            <input id="name" class="input" type="text" autocomplete="name" placeholder={t('Your name')} />
          </div>
        )}
        <div class="field">
          <label for="email">{t('Email')}</label>
          <input id="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="pw">{t('Password')}</label>
          <div class="pw-wrap">
            <input id="pw" class="input" type={show ? 'text' : 'password'} autocomplete={signup ? 'new-password' : 'current-password'} placeholder={t('At least 8 characters')} />
            <button type="button" class="pw-toggle" onClick={() => setShow(!show)}>{show ? t('Hide') : t('Show')}</button>
          </div>
        </div>
        {!signup && (
          <div style="display:flex;justify-content:flex-end">
            <a href="#/login" style="font-size:13px;font-weight:500" onClick={soon}>{t('Forgot password?')}</a>
          </div>
        )}
        <button type="submit" class="btn">{signup ? t('Create account') : t('Log in')}</button>
      </form>

      <div class="divider"><i /><span>{t('or')}</span><i /></div>

      <button type="button" class="btn ghost" onClick={soon}>{t('Continue with Google')}</button>
      <button type="button" class="btn text" style="margin-top:8px" onClick={onGuest}>{t('Continue as guest')}</button>

      <div class="legal">
        <p>{t('By continuing you agree to our')} <a href="#/login">{t('Terms')}</a> {t('and')} <a href="#/login">{t('Privacy Policy')}</a>.</p>
        <p style="color:var(--faint)">{t('For information and entertainment only. Quadora does not sell tickets or accept bets. 18+')}</p>
      </div>
    </div>
  );
}
