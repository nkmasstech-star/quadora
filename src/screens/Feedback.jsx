import { useState } from 'preact/hooks';
import { BackBar, Panel } from '../ui.jsx';
import { t } from '../i18n.js';
import { APP_NAME, CONTACT_EMAIL } from '../config.js';

const KINDS = ['Suggestion', 'Problem', 'Other'];

export function Feedback({ user, toast }) {
  const [kind, setKind] = useState('Suggestion');
  const [msg, setMsg] = useState('');
  const send = () => {
    const subject = `${APP_NAME} feedback: ${kind}`;
    const body = `${msg.trim()}\n\n---\n${APP_NAME} build ${typeof __BUILD__ !== 'undefined' ? __BUILD__ : ''}${user ? `\n${user.email}` : ''}`;
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast(t('Opening your email app…'));
    window.location.href = url;
  };
  return (
    <div>
      <BackBar title={t('Feedback')} />
      <div style="margin-top:14px">
        <Panel>
          <div class="meta" style="line-height:1.55;margin-bottom:10px">{t('Tell us what to improve. Your message opens in your email app, ready to send to us.')}</div>
          <div class="chipwrap" style="margin:0 0 10px">
            {KINDS.map((k) => <button key={k} class={kind === k ? 'chip-btn on small' : 'chip-btn small'} onClick={() => setKind(k)}>{t(k)}</button>)}
          </div>
          <textarea class="input" rows={6} maxLength={1000} value={msg} placeholder={t('Write your feedback here')} onInput={(e) => setMsg(e.currentTarget.value)} style="height:auto;padding:12px;resize:vertical" />
          <div class="meta" style="text-align:right;font-size:12px;margin:4px 2px 10px">{msg.length}/1000</div>
          <button class="btn" disabled={msg.trim().length < 5} onClick={send}>{t('Send feedback')}</button>
        </Panel>
      </div>
    </div>
  );
}
