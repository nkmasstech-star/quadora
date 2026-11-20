import { BackBar, Panel } from '../ui.jsx';
import { t } from '../i18n.js';

const STEPS = [
  ['Results', 'See the latest draw results for every game. Tap a result to open all past draws.'],
  ['Analysis', 'Under every result you get Top 3, Today and History analysis cards.'],
  ['Predictions', 'Open a game to see the daily prediction chart, numbers and Top 3. Tap a number to copy it.'],
  ['Lucky Game', 'Choose a game, open 4 Mystery Boxes and save your lucky number. Scratch card gives one more number each day.'],
  ['Community', 'Post your own predictions, like and save others, and follow players. One post per day.'],
  ['Profile', 'Your posts, saved numbers and winning percentage. We check everything automatically when results arrive.'],
];

export function HowTo() {
  return (
    <div>
      <BackBar title={t('How to Play')} />
      <div style="margin-top:14px">
        {STEPS.map(([h, b], i) => (
          <Panel key={h}>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <span class="ring" style="flex:none">{i + 1}</span>
              <div><div style="font-weight:700;margin-bottom:2px">{t(h)}</div><div class="meta" style="line-height:1.5">{t(b)}</div></div>
            </div>
          </Panel>
        ))}
      </div>
      <div class="meta" style="font-size:12px;line-height:1.5;margin:10px 4px">{t('For information and entertainment only. Q Spot 4D does not sell tickets or accept bets. 18+')}</div>
    </div>
  );
}
