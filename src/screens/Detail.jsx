import { useState } from 'preact/hooks';
import { gameById, fmtDate, nextDrawLabel } from '../data/games.js';
import { drawsOf } from '../data/store.js';
import { IconShare, IconChevron } from '../icons.jsx';
import { t } from '../i18n.js';
import { Loading, BackBar, Hero, Panel, Top3, NumberGrid } from '../ui.jsx';

export function Detail({ data, gameId, toast }) {
  const game = gameById(gameId);
  const [idx, setIdx] = useState(0);
  if (!game) return <div class="empty">{t('Game not found.')}</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;
  const draws = drawsOf(data.results, game.id);
  const draw = draws[idx];

  const share = async () => {
    if (!draw) return;
    const text = `${game.name} · ${fmtDate(draw.date)}\n1st ${draw.first}  2nd ${draw.second}  3rd ${draw.third}\nvia Quadora`;
    try {
      if (navigator.share) await navigator.share({ text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast(t('Result copied')); }
    } catch (e) { /* cancelled */ }
  };

  return (
    <div>
      <BackBar title={t('History')} right={draw && <button class="icon-btn" aria-label={t('Share result')} onClick={share}><IconShare /></button>} />
      <Hero kicker={t(game.region)} title={game.name} pill={draws.length ? `${idx + 1} / ${draws.length}` : null} />

      {!draw && <Panel><div class="empty">{t('No result stored yet.')}<br />{t('Next draw: {d}', { d: nextDrawLabel(game) })}</div></Panel>}

      {draw && (
        <div>
          <div class="nav-row" style="margin-top:14px">
            <button class="step" aria-label={t('Older draw')} disabled={idx >= draws.length - 1} onClick={() => setIdx(idx + 1)} style="transform:rotate(180deg)"><IconChevron /></button>
            <div style="text-align:center">
              <div style="font-weight:700">{fmtDate(draw.date)}</div>
              {draw.drawNo && <div class="meta">{t('Draw #{n}', { n: draw.drawNo })}</div>}
            </div>
            <button class="step" aria-label={t('Newer draw')} disabled={idx <= 0} onClick={() => setIdx(idx - 1)}><IconChevron /></button>
          </div>
          <Panel>
            <Top3 draw={draw} />
            {draw.special && draw.special.length > 0 && (<div><div class="label">{t(game.special)}</div><NumberGrid numbers={draw.special} /></div>)}
            {draw.consolation && draw.consolation.length > 0 && (<div><div class="label">{t('Consolation')}</div><NumberGrid numbers={draw.consolation} /></div>)}
          </Panel>
        </div>
      )}
    </div>
  );
}
