import { useState } from 'preact/hooks';
import { BackBar, Panel } from '../ui.jsx';
import { t, getLang, LANGS } from '../i18n.js';
import { FAQ } from '../data/faq.js';

export function Faq() {
  const [open, setOpen] = useState(0);
  const li = Math.max(0, LANGS.findIndex(([c]) => c === getLang()));
  return (
    <div>
      <BackBar title={t('FAQ')} />
      <div style="margin-top:14px">
        {FAQ.map(([q, a], i) => (
          <Panel key={i}>
            <button class="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{q[li] || q[0]}</span><span class="faq-chev">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div class="meta faq-a">{a[li] || a[0]}</div>}
          </Panel>
        ))}
      </div>
      <div class="meta" style="font-size:12px;line-height:1.5;margin:10px 4px">{t('More questions? Use Feedback in the menu.')}</div>
    </div>
  );
}
