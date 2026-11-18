import { useState, useMemo } from 'preact/hooks';
import { GAMES, fmtShort } from '../data/games.js';
import { searchHistory, totalDraws } from '../data/store.js';
import { Loading, AppBar, Hero } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';

const SHORT = (n) => n.replace(' 4D', '').replace(' 1+3D', '').replace('Sports ', '').replace('Grand Dragon Lotto', 'GD Lotto');

export function Search({ data, initial }) {
  const [q, setQ] = useState((initial || '').replace(/\D/g, '').slice(0, 4));
  const [anyOrder, setAnyOrder] = useState(false);
  const [game, setGame] = useState('all');
  const hits = useMemo(() => searchHistory(data.results, q, anyOrder, game), [data.results, q, anyOrder, game]);
  if (data.status === 'loading' && !data.results) return <Loading />;
  const stored = totalDraws(data.results);

  return (
    <div>
      <AppBar title={t('Search')} tagline={t('Find a number in past draws')} go={go} />
      <div class="hero plain" style="display:block">
        <div class="hero-title" style="font-size:20px">{t('Check any 4-digit number')}</div>
        <input class="input big-input" style="margin-top:12px" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="0000" aria-label={t('4-digit number')} value={q} onInput={(e) => setQ(e.currentTarget.value.replace(/\D/g, '').slice(0, 4))} />
        <label class="switch" style="margin-top:12px">
          <input type="checkbox" checked={anyOrder} onChange={(e) => setAnyOrder(e.currentTarget.checked)} />
          {t('Match digits in any order')}
        </label>
      </div>

      <div class="chipwrap">
        <button class={game === 'all' ? 'chip-btn on' : 'chip-btn'} onClick={() => setGame('all')}>{t('All')}</button>
        {GAMES.map((g) => <button key={g.id} class={game === g.id ? 'chip-btn on' : 'chip-btn'} onClick={() => setGame(g.id)}>{t(SHORT(g.name))}</button>)}
      </div>

      {q.length < 4 && <div class="empty">{stored ? t('Enter 4 digits to search {n} stored draws.', { n: stored }) : t('Enter 4 digits to search the draw history.')}</div>}
      {q.length === 4 && stored === 0 && <div class="empty">{t('No draw history is stored yet. It grows after every draw.')}</div>}

      {q.length === 4 && stored > 0 && (
        <div>
          <div class="section-title"><h2>{hits.length ? t('Appeared {n} times', { n: hits.length }) : t('Not found')}</h2><span>{t('{n} draws searched', { n: stored })}</span></div>
          {hits.slice(0, 60).map((h, i) => (
            <button key={i} class="hit" style="width:100%;text-align:left" onClick={() => go(`/game/${h.game.id}`)}>
              <span class="n">{h.number}</span>
              <span style="flex:1"><span style="display:block;font-weight:700;font-size:14px">{h.game.name}</span><span class="meta">{fmtShort(h.draw.date)} · {h.draw.date.slice(0, 4)}</span></span>
              <span class="pill gold">{h.prize === 'Special' ? t(h.game.special) : t(h.prize)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
