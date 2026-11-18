import { useState, useEffect, useCallback } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { loadAll } from './data/store.js';
import { IconQ, IconTrophy, IconSearch, IconUser } from './icons.jsx';
import { Login } from './screens/Login.jsx';
import { Home } from './screens/Home.jsx';
import { Detail } from './screens/Detail.jsx';
import { Predictions, PredictionDetail, Winnings } from './screens/Predictions.jsx';
import { Search } from './screens/Search.jsx';
import { Notifications } from './screens/Notifications.jsx';
import { Menu } from './screens/Menu.jsx';
import { Profile } from './screens/Profile.jsx';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

export const go = (path) => { location.hash = path; };

function useRoute() {
  const read = () => location.hash.slice(1) || '/predictions';
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const f = () => setRoute(read());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return route;
}

const TABS = [
  { path: '/predictions', label: 'Predictions', Icon: IconQ },
  { path: '/home', label: 'Results', Icon: IconTrophy },
  { path: '/search', label: 'Search', Icon: IconSearch },
  { path: '/profile', label: 'Profile', Icon: IconUser },
];

export function App() {
  const route = useRoute();
  const [data, setData] = useState({ status: 'loading', results: null, predictions: null, demo: false });
  const [toast, setToast] = useState('');
  const [guest, setGuest] = useState(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('guest')) store.set('qd_guest', '1');
    return store.get('qd_guest') === '1';
  });

  const [theme, setThemeState] = useState(() => {
    if (import.meta.env.DEV) { const t = new URLSearchParams(location.search).get('theme'); if (t) store.set('qd_theme', t); }
    const t = store.get('qd_theme'); return ['light', 'black', 'charcoal', 'teal'].includes(t) ? t : 'black';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = { light: '#F3F5FA', black: '#000000', charcoal: '#12100E', teal: '#0B1519' }[theme];
    if (meta) meta.setAttribute('content', bg);
    try {
      StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: bg }).catch(() => {});
    } catch (e) { /* web */ }
  }, [theme]);
  const setTheme = (t) => { store.set('qd_theme', t); setThemeState(t); };

  const [menuOpen, setMenuOpen] = useState(!!(import.meta.env.DEV && location.search.includes('menu')));
  useEffect(() => { const h = () => setMenuOpen(true); window.addEventListener('qd-menu', h); return () => window.removeEventListener('qd-menu', h); }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);

  const refresh = useCallback(() => {
    setData((d) => ({ ...d, status: 'loading' }));
    loadAll().then((r) => setData({ status: 'ready', ...r }));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    let handle;
    CapApp.addListener('backButton', () => {
      if (location.hash.startsWith('#/game/') || location.hash.startsWith('#/prediction/') || location.hash === '#/winnings' || location.hash === '#/notifications' || location.hash.startsWith('#/search?')) history.back();
      else if (location.hash && location.hash !== '#/predictions' && location.hash !== '#/login') go('/predictions');
      else CapApp.exitApp();
    }).then((h) => { handle = h; }).catch(() => {});
    return () => { if (handle) handle.remove(); };
  }, []);

  const enterAsGuest = () => { store.set('qd_guest', '1'); setGuest(true); go('/predictions'); };
  const signOut = () => { store.del('qd_guest'); setGuest(false); go('/login'); };

  const [path, queryStr] = route.split('?');
  const query = new URLSearchParams(queryStr || '');
  const seg = path.split('/').filter(Boolean);

  if (!guest || seg[0] === 'login') {
    return (
      <div class="app">
        <Login onGuest={enterAsGuest} toast={showToast} />
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  let screen;
  let nav = true;
  if (seg[0] === 'game') { screen = <Detail data={data} gameId={seg[1]} toast={showToast} />; nav = false; }
  else if (seg[0] === 'prediction') { screen = <PredictionDetail data={data} gameId={seg[1]} />; nav = false; }
  else if (seg[0] === 'notifications') { screen = <Notifications />; nav = false; }
  else if (seg[0] === 'winnings') { screen = <Winnings />; nav = false; }
  else if (seg[0] === 'search') screen = <Search data={data} initial={query.get('q') || ''} />;
  else if (seg[0] === 'profile') screen = <Profile theme={theme} setTheme={setTheme} data={data} onSignOut={signOut} onRefresh={refresh} toast={showToast} />;
  else if (seg[0] === 'home') screen = <Home data={data} />;
  else screen = <Predictions data={data} toast={showToast} />;

  const active = '/' + (seg[0] || 'predictions');

  return (
    <div class="app">
      <main class={nav ? 'screen' : 'screen no-nav'}>{screen}</main>
      {nav && (
        <nav class="nav" aria-label="Main">
          <div class="nav-inner">
            {TABS.map(({ path: p, label, Icon }) => (
              <button key={p} class={active === p ? 'nav-item on' : 'nav-item'} aria-label={label} aria-current={active === p ? 'page' : undefined} onClick={() => go(p)}>
                <Icon />
                {active === p && <span>{label}</span>}
              </button>
            ))}
          </div>
        </nav>
      )}
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} go={go} toast={showToast} />
      {toast && <div class="toast" role="status">{toast}</div>}
    </div>
  );
}
