import { useState, useEffect, useCallback } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { loadAll } from './data/store.js';
import { t, setLang as applyLang } from './i18n.js';
import { IconQ, IconTrophy, IconSearch, IconUser, IconUsers } from './icons.jsx';
import { Login } from './screens/Login.jsx';
import { Home } from './screens/Home.jsx';
import { Detail } from './screens/Detail.jsx';
import { Predictions, PredictionDetail, Winnings, PredHistoryPage } from './screens/Predictions.jsx';
import { Search } from './screens/Search.jsx';
import { AnalysisToday, AnalysisHistory, AnalysisTop3 } from './screens/Analysis.jsx';
import { Lucky } from './screens/Lucky.jsx';
import { Poll } from './screens/Poll.jsx';
import { InterstitialHost } from './ads.jsx';
import { NotifBanner } from './NotifBanner.jsx';
import { setBadge, inboxOf, seenOf } from './data/inbox.js';
import { buildAlerts } from './data/alerts.js';
import { Community } from './screens/Community.jsx';
import { Notifications } from './screens/Notifications.jsx';
import { Menu } from './screens/Menu.jsx';
import { Profile } from './screens/Profile.jsx';
import { Settings } from './screens/Settings.jsx';
import { HowTo } from './screens/HowTo.jsx';
import { Faq } from './screens/Faq.jsx';
import { StraightList, StraightChart } from './screens/Straight.jsx';
import { Feedback } from './screens/Feedback.jsx';
import { Splash } from './screens/Splash.jsx';
import { Agree } from './screens/Agree.jsx';
import { Legal } from './screens/Legal.jsx';
import { Locked } from './ui.jsx';
import { currentUser, logOut, deleteAccount, googleSignIn } from './data/account.js';

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
  { path: '/community', label: 'Community', Icon: IconUsers },
  { path: '/search', label: 'Search', Icon: IconSearch },
  { path: '/profile', label: 'Profile', Icon: IconUser },
];

export function App() {
  const route = useRoute();
  const [data, setData] = useState({ status: 'loading', results: null, predictions: null, demo: false });
  const [toast, setToast] = useState('');
  const [user, setUserState] = useState(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('asuser') && !currentUser()) { googleSignIn({ name: 'Nehru', email: 'nehru@test.com', dob: null }); store.set('qd_guest', '1'); }
    return currentUser();
  });
  const setUser = (u) => setUserState(u ? { ...u } : null);
  const [splash, setSplash] = useState(!(import.meta.env.DEV && location.search.includes('nosplash')));
  const [agreed, setAgreed] = useState(() => store.get('qd_agreed') === '1' || !!(import.meta.env.DEV && location.search.includes('agreed')));
  const [, setLangTick] = useState(0);
  const setLang = (l) => { applyLang(l); setLangTick((n) => n + 1); };
  useEffect(() => { applyLang(localStorage.getItem('qd_lang') || 'en'); }, []);
  if (import.meta.env.DEV) { const q = new URLSearchParams(location.search).get('lang'); if (q) applyLang(q); }
  const [guest, setGuest] = useState(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('guest')) store.set('qd_guest', '1');
    return store.get('qd_guest') === '1';
  });
  const [seenLogin, setSeenLogin] = useState(false); // eslint-disable-line

  const [theme, setThemeState] = useState(() => {
    if (import.meta.env.DEV) { const t = new URLSearchParams(location.search).get('theme'); if (t) store.set('qd_theme', t); }
    const t = store.get('qd_theme'); if (['light', 'black', 'charcoal', 'teal'].includes(t)) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'light';
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
  // red dot on the bell = unread likes/follows + result alerts and announcements not opened yet
  useEffect(() => {
    const calc = () => {
      if (!user) { setBadge(0); return; }
      const seen = new Set(seenOf(user.uid));
      const alerts = buildAlerts(user, data.results).filter((x) => !seen.has(x.id)).length;
      const anns = ((data && data.announcements) || []).filter((x) => !seen.has(x.id)).length;
      setBadge(inboxOf(user.uid).filter((x) => !x.read).length + alerts + anns);
    };
    calc();
    window.addEventListener('qd-inbox', calc); window.addEventListener('qd-badge', calc);
    return () => { window.removeEventListener('qd-inbox', calc); window.removeEventListener('qd-badge', calc); };
  }, [user && user.uid, data]);
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
      if (location.hash.startsWith('#/game/') || location.hash.startsWith('#/prediction/') || location.hash.startsWith('#/predhist/') || location.hash.startsWith('#/howto') || location.hash === '#/faq' || location.hash.startsWith('#/straight') || location.hash === '#/feedback' || location.hash.startsWith('#/analysis/') || location.hash === '#/lucky' || location.hash === '#/poll' || location.hash === '#/settings' || location.hash.startsWith('#/user/') || location.hash.startsWith('#/legal/') || location.hash === '#/locked' || location.hash === '#/winnings' || location.hash === '#/notifications' || location.hash.startsWith('#/search?')) history.back();
      else if (location.hash && location.hash !== '#/predictions' && location.hash !== '#/login') go('/predictions');
      else CapApp.exitApp();
    }).then((h) => { handle = h; }).catch(() => {});
    return () => { if (handle) handle.remove(); };
  }, []);

  const enterAsGuest = () => { store.set('qd_guest', '1'); setGuest(true); go('/predictions'); };
  const onAuth = (u) => { setUser(u); store.set('qd_guest', '1'); setGuest(true); go('/predictions'); };
  const onLogOut = () => { logOut(); setUser(null); store.del('qd_guest'); setGuest(false); go('/login'); };
  const onDelete = () => { deleteAccount(); setUser(null); store.del('qd_guest'); setGuest(false); go('/login'); };

  const [path, queryStr] = route.split('?');
  const query = new URLSearchParams(queryStr || '');
  const seg = path.split('/').filter(Boolean);

  if (splash) return <div class="app"><Splash onDone={() => setSplash(false)} /></div>;
  if (!agreed && seg[0] !== 'legal') return <div class="app"><Agree onAccept={() => { store.set('qd_agreed', '1'); setAgreed(true); }} /></div>;
  if (seg[0] === 'legal') {
    return (
      <div class="app"><main class="screen no-nav"><div class="page push"><Legal kind={seg[1]} /></div></main>{toast && <div class="toast" role="status">{toast}</div>}</div>
    );
  }
  if ((!guest && !user) || seg[0] === 'login') {
    return (
      <div class="app">
        <Login onGuest={enterAsGuest} onAuth={onAuth} toast={showToast} />
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  const MEMBER_ONLY = ['lucky', 'poll', 'analysis', 'game', 'search', 'locked'];
  let screen;
  let nav = true;
  if (!user && MEMBER_ONLY.includes(seg[0])) { screen = <Locked onLogin={() => go('/login')} onBack={() => history.back()} />; nav = false; }
  else if (seg[0] === 'game') { screen = <Detail data={data} gameId={seg[1]} toast={showToast} />; nav = false; }
  else if (seg[0] === 'prediction') { screen = <PredictionDetail data={data} gameId={seg[1]} toast={showToast} />; nav = false; }
  else if (seg[0] === 'analysis') { screen = seg[1] === 'top3' ? <AnalysisTop3 data={data} gameId={seg[2]} date={seg[3]} /> : seg[1] === 'history' ? <AnalysisHistory data={data} gameId={seg[2]} date={seg[3]} /> : <AnalysisToday data={data} gameId={seg[2]} date={seg[3]} />; nav = false; }
  else if (seg[0] === 'predhist') { screen = <PredHistoryPage data={data} gameId={seg[1]} toast={showToast} />; nav = false; }
  else if (seg[0] === 'feedback') { screen = <Feedback user={user} toast={showToast} />; nav = false; }
  else if (seg[0] === 'howto') { screen = <HowTo />; nav = false; }
  else if (seg[0] === 'straight') { screen = seg[1] ? <StraightChart data={data} gameId={seg[1]} /> : <StraightList data={data} />; nav = false; }
  else if (seg[0] === 'faq') { screen = <Faq />; nav = false; }
  else if (seg[0] === 'poll') { screen = <Poll user={user} toast={showToast} />; nav = false; }
  else if (seg[0] === 'lucky') { screen = <Lucky user={user} toast={showToast} />; nav = false; }
  else if (seg[0] === 'notifications') { screen = <Notifications user={user} data={data} />; nav = false; }
  else if (seg[0] === 'winnings') { screen = <Winnings data={data} toast={showToast} />; nav = false; }
  else if (seg[0] === 'settings') { screen = <Settings user={user} theme={theme} setTheme={setTheme} setLang={setLang} data={data} onLogOut={onLogOut} onDelete={onDelete} onRefresh={refresh} toast={showToast} />; nav = false; }
  else if (seg[0] === 'user') { screen = user ? <Profile user={user} uid={seg[1]} data={data} toast={showToast} onUser={setUser} /> : <Locked onLogin={() => go('/login')} />; nav = false; }
  else if (seg[0] === 'community') screen = <Community user={user} data={data} toast={showToast} />;
  else if (seg[0] === 'search') screen = <Search data={data} initial={query.get('q') || ''} />;
  else if (seg[0] === 'profile') screen = <Profile user={user} data={data} toast={showToast} onUser={setUser} />;
  else if (seg[0] === 'home') screen = <Home data={data} user={user} />;
  else screen = <Predictions data={data} toast={showToast} />;

  const active = '/' + (seg[0] || 'predictions');

  return (
    <div class="app">
      <main class={nav ? 'screen' : 'screen no-nav'}><div key={path} class={nav ? 'page' : 'page push'}>{screen}</div></main>
      {nav && (
        <nav class="nav" aria-label="Main">
          <div class="nav-inner">
            {TABS.map(({ path: p, label, Icon }) => (
              <button key={p} class={active === p ? 'nav-item on' : 'nav-item'} aria-label={t(label)} aria-current={active === p ? 'page' : undefined} onClick={() => go(p)}>
                <Icon />
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
      <InterstitialHost />
      <NotifBanner user={user} data={data} />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} go={go} toast={showToast} />
      {toast && <div class="toast" role="status">{toast}</div>}
    </div>
  );
}
