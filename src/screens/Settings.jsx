import { useState } from 'preact/hooks';
import { totalDraws } from '../data/store.js';
import { IconChevron } from '../icons.jsx';
import { BackBar, Sheet } from '../ui.jsx';
import { blockedOf, toggleBlock, userInfo, myPosts, myPicks, myLucky, clearMyPosts, clearMyPicks, clearMyLucky } from '../data/community.js';
import { go } from '../App.jsx';
import { t, LANGS, getLang } from '../i18n.js';
import { APP_NAME } from '../config.js';
import { notifOn, setNotif } from '../data/alerts.js';
import { Avatar } from '../avatars.jsx';
import { AvatarPicker, NameSheet } from './Profile.jsx';
import { setAvatar } from '../data/account.js';
import { AVATAR_EDITS } from '../config.js';
import { setPhoto, removePhoto, photoOf, photoChangesLeft, PHOTO_MAX_CHANGES } from '../data/photo.js';

const THEMES = [
  { id: 'light', name: 'Light', bg: '#F3F5FA', line: '#D9DFEC', gold: '#E3A82A' },
  { id: 'black', name: 'Black', bg: '#000000', line: '#25252B', gold: '#E8B94A' },
  { id: 'charcoal', name: 'Charcoal', bg: '#12100E', line: '#332E27', gold: '#E8B94A' },
  { id: 'teal', name: 'Teal', bg: '#0B1519', line: '#22404B', gold: '#E8B94A' },
];

export function Settings({ user, theme, setTheme, setLang, data, onLogOut, onDelete, onRefresh, toast, onUser }) {
  const [edit, setEdit] = useState(null); // pic | avatar | name
  const [busy, setBusy] = useState(false);
  const pickFile = async (e) => {
    const f = e.currentTarget.files && e.currentTarget.files[0]; e.currentTarget.value = '';
    if (!f) return;
    setBusy(true); const r = await setPhoto(user.uid, f); setBusy(false);
    if (r.error) { toast(t(r.error)); return; }
    setEdit(null); toast(t('Profile photo updated'));
  };
  const [confirmDel, setConfirmDel] = useState(false);
  const [notif, setN] = useState(notifOn());
  const [blkOpen, setBlkOpen] = useState(false);
  const [, tick] = useState(0);
  const updated = data.results && data.results.updated ? data.results.updated.slice(0, 16).replace('T', ' ') : t('No update yet');
  return (
    <div>
      <BackBar title={t('Settings')} />

      {user && <div class="rows" style="margin-top:14px">
        <div class="row" style="gap:12px"><Avatar id={user.avatar} uid={user.uid} size={44} ring /><span style="flex:1;font-weight:700">{user.name}</span></div>
        <button class="row" onClick={() => setEdit('pic')}><span style="flex:1;text-align:left">{t('Change profile picture')}</span><IconChevron /></button>
        <button class="row" onClick={() => setEdit('name')}><span style="flex:1;text-align:left">{t('Edit name')}</span><IconChevron /></button>
      </div>}
      {edit === 'pic' && (
        <Sheet title={t('Change profile picture')} onClose={() => !busy && setEdit(null)}>
          <label class={photoChangesLeft(user.uid) > 0 && !busy ? 'gtype' : 'gtype off'}>
            <span class="gt-ic">🖼️</span>
            <span><b>{busy ? t('Uploading…') : t('Upload from gallery')}</b><small>{t('Any size. We crop and shrink it for you. Changes left: {n} of {m}', { n: Math.max(0, photoChangesLeft(user.uid)), m: PHOTO_MAX_CHANGES })}</small></span>
            <input type="file" accept="image/*" style="display:none" disabled={busy || photoChangesLeft(user.uid) <= 0} onChange={pickFile} />
          </label>
          <button class="gtype" disabled={busy} onClick={() => setEdit('avatar')}>
            <span class="gt-ic">😀</span>
            <span><b>{t('Choose a sticker')}</b><small>{t('Avatar changes left: {n}', { n: AVATAR_EDITS - (user.avatarEdits || 0) })}</small></span>
          </button>
          {photoOf(user.uid) && <button class="btn text danger" disabled={busy} onClick={async () => { const r = await removePhoto(user.uid); if (r.error) toast(t(r.error)); else { setEdit(null); toast(t('Photo removed')); } }}>{t('Remove photo, use my sticker')}</button>}
          <div class="meta" style="font-size:12px;line-height:1.45;margin-top:8px">{t('Use a photo you are allowed to share. Photos reported by players are hidden.')}</div>
        </Sheet>
      )}
      {edit === 'avatar' && <AvatarPicker current={user.avatar} left={AVATAR_EDITS - (user.avatarEdits || 0)} onClose={() => setEdit(null)} onPick={(a) => { const r = setAvatar(a); if (r.error) { toast(t(r.error)); return; } onUser(r.user); if (photoOf(user.uid)) removePhoto(user.uid); setEdit(null); toast(t('Saved')); }} />}
      {edit === 'name' && <NameSheet user={user} toast={toast} onClose={() => setEdit(null)} onDone={(nu) => { onUser(nu); setEdit(null); }} />}

      <div class="rows" style="margin-top:14px">
        <div class="row" role="radiogroup" aria-label={t('Theme')}>
          <span style="flex:1">{t('Theme')}</span>
          <span class="swatches">
            {THEMES.map((th) => (
              <button key={th.id} role="radio" aria-checked={theme === th.id} aria-label={t(th.name)} title={t(th.name)} class={theme === th.id ? 'swatch on' : 'swatch'} onClick={() => setTheme(th.id)} style={`background:${th.bg};border-color:${th.line}`}>
                <i style={`background:${th.gold}`} />
              </button>
            ))}
          </span>
        </div>
        <button class="row" role="switch" aria-checked={notif} onClick={() => { const v = !notif; setNotif(v); setN(v); toast(v ? t('Notifications on') : t('Notifications off')); }}>
          <span style="flex:1;text-align:left">{t('Notifications')}</span>
          <span class={notif ? 'toggle on' : 'toggle'} />
        </button>
        <div class="row" style="display:block">
          <div style="margin-bottom:10px">{t('Language')}</div>
          <div class="langrow" style="margin:0">
            {LANGS.map(([k, n]) => <button key={k} class={getLang() === k ? 'chip-btn on' : 'chip-btn'} onClick={() => setLang(k)}>{n}</button>)}
          </div>
        </div>
      </div>

      <div class="section-title"><h2>{t('Data')}</h2></div>
      <div class="rows">
        <div class="row"><span style="flex:1">{t('Results updated')}</span><span class="meta">{updated}</span></div>
        {data.results && data.results.dummy && <div class="row"><span style="flex:1">Data</span><span class="meta" style="color:var(--gold-text);font-weight:700">Demo (test)</span></div>}
        <div class="row"><span style="flex:1">{t('Draws stored')}</span><span class="meta">{totalDraws(data.results)}</span></div>
        <button class="row" onClick={() => { onRefresh(); toast(t('Refreshing…')); }}><span style="flex:1;color:var(--gold-text);font-weight:700">{t('Refresh data')}</span></button>
      </div>

      {user && (
        <div>
          <div class="section-title"><h2>{t('Delete my data')}</h2></div>
          <div class="rows">
            {[
              ['posts', t('Delete my posts'), myPosts(user.uid).length, clearMyPosts],
              ['picks', t('Delete my saved predictions'), myPicks(user.uid).length, clearMyPicks],
              ['lucky', t('Delete my saved lucky numbers'), myLucky(user.uid).length, clearMyLucky],
            ].map(([k, label, n, fn]) => (
              <button key={k} class="row" disabled={n === 0} onClick={() => { if (confirm(t('Delete all? This cannot be undone.'))) { fn(user.uid); tick((x) => x + 1); toast(t('Deleted')); } }}>
                <span style="flex:1;text-align:left;color:var(--danger, #E5484D);font-weight:700">{label}</span><span class="meta">{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div class="section-title"><h2>{t('About')}</h2></div>
      <div class="rows">
        {[['privacy', 'Privacy Policy'], ['terms', 'Terms of Use'], ['disclaimer', 'Disclaimer']].map(([k, l]) => (
          <button key={k} class="row" onClick={() => go(`/legal/${k}`)}><span style="flex:1">{t(l)}</span><span class="chev"><IconChevron /></span></button>
        ))}
        <div class="row"><span style="flex:1">{t('Version')}</span><span class="meta">{APP_NAME} 0.1.0 · build {__BUILD__}</span></div>
      </div>
      <div class="meta" style="font-size:12px;line-height:1.5;margin:10px 4px">{t('For information and entertainment only. Q Spot 4D does not sell tickets or accept bets. 18+')}</div>

      <div class="section-title"><h2>{t('Account')}</h2></div>
      <div class="rows">
        {user ? (
          <div>
            <button class="row" onClick={() => setBlkOpen(true)}><span style="flex:1">{t('Blocked players')}</span><span class="meta">{blockedOf(user.uid).length}</span><span class="chev"><IconChevron /></span></button>
            <div class="row"><span style="flex:1">{t('Signed in as')}</span><span class="meta">{user.email}</span></div>
            <button class="row" onClick={onLogOut}><span style="flex:1">{t('Log out')}</span></button>
            {!confirmDel && <button class="row" onClick={() => setConfirmDel(true)}><span style="flex:1;color:#E5484D;font-weight:600">{t('Delete my account')}</span></button>}
            {confirmDel && (
              <div class="row" style="display:block">
                <div class="meta" style="line-height:1.55;margin-bottom:10px">{t('This permanently deletes your profile and posts. It cannot be undone.')}</div>
                <div style="display:flex;gap:8px"><button class="btn ghost" style="height:44px" onClick={() => setConfirmDel(false)}>{t('Cancel')}</button><button class="btn" style="height:44px;background:#E5484D;color:#fff" onClick={onDelete}>{t('Delete')}</button></div>
              </div>
            )}
          </div>
        ) : (
          <button class="row" onClick={() => go('/login')}><span style="flex:1;color:var(--gold-text);font-weight:700">{t('Log in or sign up')}</span></button>
        )}
      </div>
      {blkOpen && user && (
        <Sheet title={t('Blocked players')} onClose={() => setBlkOpen(false)}>
          {blockedOf(user.uid).length === 0 && <div class="empty">{t('You have not blocked anyone.')}</div>}
          {blockedOf(user.uid).map((id) => (
            <div key={id} class="row"><span style="flex:1">{userInfo(id, user).name}</span><button class="chip-btn small" onClick={() => { toggleBlock(user.uid, id); tick((n) => n + 1); }}>{t('Unblock')}</button></div>
          ))}
        </Sheet>
      )}
    </div>
  );
}
