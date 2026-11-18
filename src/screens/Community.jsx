import { AppBar, Hero, Panel } from '../ui.jsx';
import { go } from '../App.jsx';
import { t } from '../i18n.js';

// DUMMY posts for testing the layout. Replace with real community data later.
const POSTS = [
  { name: 'Kumar', game: 'magnum', when: '2h', text: 'Magnum today had two pairs in the starter group. Anyone tracking 9 as the hot digit?', likes: 18 },
  { name: 'Mei Ling', game: 'singapore', when: '5h', text: 'Last 3 digits 028 repeated again this week. Interesting pattern.', likes: 12 },
  { name: 'Sok', game: 'gdlotto', when: '1d', text: 'GD Lotto daily numbers look balanced between odd and even lately.', likes: 7 },
  { name: 'Ahmad', game: 'toto', when: '1d', text: 'Sharing my weekly digit chart soon. Stay tuned.', likes: 4 },
];
const NAMES = { magnum: 'Magnum', toto: 'Toto', damacai: 'Da Ma Cai', singapore: 'Singapore', gdlotto: 'GD Lotto' };

export function Community() {
  return (
    <div>
      <AppBar title={t('Community')} tagline={t('Talk numbers with other players')} go={go} />
      <Hero kicker={t('Players')} title={t('Community')} pill={t('Soon')} />
      <div class="section-title"><h2>{t('Sample posts')}</h2></div>
      {POSTS.map((p, i) => (
        <div key={i} class="post" data-game={p.game}>
          <div class="post-top">
            <span class="ring sm">{p.name[0]}</span>
            <span style="flex:1"><b>{p.name}</b><span class="meta"> · {p.when}</span></span>
            <span class="pill gold">{NAMES[p.game]}</span>
          </div>
          <div class="post-text">{p.text}</div>
          <div class="meta">♥ {p.likes}</div>
        </div>
      ))}
      <Panel><div class="empty">{t('Chat, polls and shared tips will come in a later update.')}</div></Panel>
    </div>
  );
}
