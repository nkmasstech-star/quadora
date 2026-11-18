import { useState, useEffect, useCallback } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { loadAll } from './data/store.js';
import { IconHome, IconSpark, IconSearch, IconUser } from './icons.jsx';
import { Login } from './screens/Login.jsx';
import { Home } from './screens/Home.jsx';
import { Detail } from './screens/Detail.jsx';
import { Predictions } from './screens/Predictions.jsx';
import { Search } from './screens/Search.jsx';
import { Profile } from './screens/Profile.jsx';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

export const go = (path) => { location.hash = path; };

function useRoute() {
  const read = () => location.hash.slice(1) || '/home';
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const f = () => setRoute(read());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return route;
}

const TABS = [
  { path: '/home', label: 'Home', Icon: IconHome },
  { path: '/predictions', label: 'Predictions', Icon: IconSpark },
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
      if (location.hash.startsWith('#/game/') || location.hash.startsWith('#/search?')) history.back();
      else if (location.hash && location.hash !== '#/home' && location.hash !== '#/login') go('/home');
      else CapApp.exitApp();
    }).then((h) => { handle = h; }).catch(() => {});
    return () => { if (handle) handle.remove(); };
  }, []);

  const enterAsGuest = () => { store.set('qd_guest', '1'); setGuest(true); go('/home'); };
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
  else if (seg[0] === 'predictions') screen = <Predictions data={data} />;
  else if (seg[0] === 'search') screen = <Search data={data} initial={query.get('q') || ''} />;
  else if (seg[0] === 'profile') screen = <Profile data={data} onSignOut={signOut} onRefresh={refresh} toast={showToast} />;
  else screen = <Home data={data} />;

  const active = '/' + (seg[0] || 'home');

  return (
    <div class="app">
      <main class={nav ? 'screen' : 'screen no-nav'}>{screen}</main>
      {nav && (
        <nav class="nav" aria-label="Main">
          <div class="nav-inner">
            {TABS.map(({ path: p, label, Icon }) => (
              <button key={p} class={active === p ? 'nav-item on' : 'nav-item'} aria-current={active === p ? 'page' : undefined} onClick={() => go(p)}>
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
      {toast && <div class="toast" role="status">{toast}</div>}
    </div>
  );
}
