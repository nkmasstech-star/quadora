import { useState } from 'preact/hooks';
import { gameById, fmtDate, nextDrawLabel } from '../data/games.js';
import { drawsOf } from '../data/store.js';
import { IconBack, IconShare, IconChevron } from '../icons.jsx';
import { Top3, NumberGrid, Loading } from '../ui.jsx';

export function Detail({ data, gameId, toast }) {
  const game = gameById(gameId);
  const [idx, setIdx] = useState(0);
  if (!game) return <div class="empty">Game not found.</div>;
  if (data.status === 'loading' && !data.results) return <Loading />;

  const draws = drawsOf(data.results, game.id);
  const draw = draws[idx];

  const share = async () => {
    if (!draw) return;
    const text = `${game.name} · ${fmtDate(draw.date)}\n1st ${draw.first}  2nd ${draw.second}  3rd ${draw.third}\nvia Quadora`;
    try {
      if (navigator.share) await navigator.share({ text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast('Result copied'); }
    } catch (e) { /* cancelled */ }
  };

  return (
    <div>
      <div class="topbar">
        <button class="back" aria-label="Back" onClick={() => history.back()}><IconBack /></button>
        <div>
          <div class="title">{game.name}</div>
          <div class="sub">{game.region}</div>
        </div>
        <span class="spacer" />
        {draw && <button class="icon-btn" aria-label="Share result" onClick={share}><IconShare /></button>}
      </div>

      {data.demo && <div class="banner">DEMO DATA: sample numbers, not real results.</div>}

      {!draw && (
        <div class="card">
          <div class="empty">
            No result stored yet for {game.name}.
            <br />
            Next draw: {nextDrawLabel(game)}
          </div>
        </div>
      )}

      {draw && (
        <div>
          <div class="nav-row">
            <button class="step" aria-label="Older draw" disabled={idx >= draws.length - 1} onClick={() => setIdx(idx + 1)} style="transform:rotate(180deg)"><IconChevron /></button>
            <div style="text-align:center">
              <div style="font-weight:600">{fmtDate(draw.date)}</div>
              {draw.drawNo && <div class="meta">Draw #{draw.drawNo}</div>}
            </div>
            <button class="step" aria-label="Newer draw" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}><IconChevron /></button>
          </div>

          <Top3 draw={draw} />

          {draw.special && draw.special.length > 0 && (
            <div>
              <div class="label">Special</div>
              <NumberGrid numbers={draw.special} />
            </div>
          )}
          {draw.consolation && draw.consolation.length > 0 && (
            <div>
              <div class="label">Consolation</div>
              <NumberGrid numbers={draw.consolation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
