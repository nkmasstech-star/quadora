import { useState } from 'preact/hooks';
import { Logo } from '../icons.jsx';
import { t } from '../i18n.js';
import { signUp, logIn, googleDemo } from '../data/account.js';
import { go } from '../App.jsx';

export function Login({ onGuest, onAuth, toast }) {
  const [signup, setSignup] = useState(false);
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (signup && name.trim().length < 2) { setErr('Please enter your name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Please enter a valid email.'); return; }
    if (pw.length < 8) { setErr('Password needs at least 8 characters.'); return; }
    const r = signup ? signUp(name, email, pw) : logIn(email, pw);
    if (r.error) { setErr(r.error); return; }
    setErr(''); onAuth(r.user);
  };
  const google = () => { const r = googleDemo(); toast(t('Test mode: demo Google account')); onAuth(r.user); };
  const forgot = (e) => { e.preventDefault(); toast(t('Password reset comes with the online accounts update.')); };

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
          <div class="display" style="font-weight:700;font-size:32px;line-height:1;letter-spacing:-0.5px">Quadora <span style="color:var(--gold-text)">4D</span></div>
          <div class="sub" style="margin-top:2px">{t('4D Predictions · Results · Analysis')}</div>
        </div>
      </div>

      <div style="margin-top:30px">
        <h1>{signup ? t('Create your account') : t('Welcome back')}</h1>
        <p class="sub" style="font-size:14px;margin:6px 0 0;line-height:1.5">
          {signup ? t('Sign up to join the community, play the Lucky Game and unlock full analysis.') : t('Log in to join the community, play the Lucky Game and unlock full analysis.')}
        </p>
      </div>

      <div class="seg" style="margin-top:20px">
        <button type="button" class={signup ? '' : 'on'} aria-pressed={!signup} onClick={() => { setSignup(false); setErr(''); }}>{t('Log in')}</button>
        <button type="button" class={signup ? 'on' : ''} aria-pressed={signup} onClick={() => { setSignup(true); setErr(''); }}>{t('Sign up')}</button>
      </div>

      <form onSubmit={submit} style="margin-top:18px;display:flex;flex-direction:column;gap:14px">
        {signup && (
          <div class="field">
            <label for="name">{t('Name')}</label>
            <input id="name" class="input" type="text" autocomplete="name" placeholder={t('Your name')} value={name} onInput={(e) => setName(e.currentTarget.value)} />
          </div>
        )}
        <div class="field">
          <label for="email">{t('Email')}</label>
          <input id="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
        </div>
        <div class="field">
          <label for="pw">{t('Password')}</label>
          <div class="pw-wrap">
            <input id="pw" class="input" type={show ? 'text' : 'password'} autocomplete={signup ? 'new-password' : 'current-password'} placeholder={t('At least 8 characters')} value={pw} onInput={(e) => setPw(e.currentTarget.value)} />
            <button type="button" class="pw-toggle" onClick={() => setShow(!show)}>{show ? t('Hide') : t('Show')}</button>
          </div>
        </div>
        {!signup && (
          <div style="display:flex;justify-content:flex-end">
            <a href="#/login" style="font-size:13px;font-weight:500" onClick={forgot}>{t('Forgot password?')}</a>
          </div>
        )}
        {err && <div class="form-err" role="alert">{t(err)}</div>}
        <button type="submit" class="btn">{signup ? t('Create account') : t('Log in')}</button>
      </form>

      <div class="divider"><i /><span>{t('or')}</span><i /></div>

      <button type="button" class="btn ghost" onClick={google}>{t('Continue with Google')}</button>
      <button type="button" class="btn text" style="margin-top:8px" onClick={onGuest}>{t('Continue as guest')}</button>
      <div class="meta" style="text-align:center;font-size:12px;line-height:1.5">{t('Guests can view predictions and today\'s results only.')}</div>

      <div class="legal">
        <p>{t('By continuing you agree to our')} <a href="#/legal/terms" onClick={(e) => { e.preventDefault(); go('/legal/terms'); }}>{t('Terms')}</a>, <a href="#/legal/privacy" onClick={(e) => { e.preventDefault(); go('/legal/privacy'); }}>{t('Privacy Policy')}</a> {t('and')} <a href="#/legal/disclaimer" onClick={(e) => { e.preventDefault(); go('/legal/disclaimer'); }}>{t('Disclaimer')}</a>.</p>
        <p style="color:var(--faint)">{t('For information and entertainment only. Quadora does not sell tickets or accept bets. 18+')}</p>
      </div>
    </div>
  );
}
