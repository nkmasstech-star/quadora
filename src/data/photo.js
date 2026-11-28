// Own profile photo from the gallery. Any size can be picked; the phone crops it to a square and squeezes it under
// 100 KB before upload (Firebase Storage avatars/{uid}.jpg, one file per player, replaced on change).
// A player can set a photo 3 times in total. 3 reports hide a photo for everyone (back to the sticker).
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { app, db, auth } from '../firebase.js';
import { C } from './cloud.js';

export const PHOTO_MAX_CHANGES = 3;
export const PHOTO_HIDE_AT = 3;
const MAX_BYTES = 100 * 1024;
const fire = () => window.dispatchEvent(new Event('qd-data'));

export const photoOf = (uid) => { const u = C.users[uid]; return u && u.photo && (u.photoReports || 0) < PHOTO_HIDE_AT ? u.photo : ''; };
export const photoChangesLeft = (uid) => PHOTO_MAX_CHANGES - ((C.users[uid] && C.users[uid].photoEdits) || 0);

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
const toBlob = (c, q) => new Promise((r) => c.toBlob(r, 'image/jpeg', q));

// centre square crop, then smaller size / lower quality until it is under 100 KB
export async function compressPhoto(file) {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2; const sy = (img.naturalHeight - side) / 2;
  for (const size of [320, 256, 192]) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      const b = await toBlob(c, q);
      if (b && b.size <= MAX_BYTES) return b;
    }
  }
  throw new Error('too big');
}

export async function setPhoto(uid, file) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return { error: 'Please log in again.' };
  if (photoChangesLeft(uid) <= 0) return { error: 'You have used all 3 photo changes.' };
  let blob;
  try { blob = await compressPhoto(file); } catch (e) { return { error: 'This picture could not be used. Try another one.' }; }
  try {
    const r = ref(getStorage(app), `avatars/${uid}.jpg`);
    await uploadBytes(r, blob, { contentType: 'image/jpeg', cacheControl: 'public,max-age=86400' });
    const url = `${await getDownloadURL(r)}&v=${Date.now()}`;
    const edits = ((C.users[uid] && C.users[uid].photoEdits) || 0) + 1;
    await updateDoc(doc(db, 'users', uid), { photo: url, photoEdits: edits, photoReports: 0 });
    const u = C.users[uid] || (C.users[uid] = { uid }); u.photo = url; u.photoEdits = edits; u.photoReports = 0; fire();
    return { ok: true };
  } catch (e) { return { error: 'Upload failed. Check your internet and try again.' }; }
}

// back to the sticker (does not use a change)
export async function removePhoto(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), { photo: '' });
    deleteObject(ref(getStorage(app), `avatars/${uid}.jpg`)).catch(() => {});
    if (C.users[uid]) C.users[uid].photo = ''; fire();
    return { ok: true };
  } catch (e) { return { error: 'Could not remove. Check your internet.' }; }
}

export async function reportPhoto(me, uid) {
  try {
    const b = writeBatch(db);
    b.set(doc(db, 'users', uid, 'photoReports', me.uid), { at: Date.now() });
    b.update(doc(db, 'users', uid), { photoReports: increment(1) });
    await b.commit();
    const u = C.users[uid]; if (u) u.photoReports = (u.photoReports || 0) + 1; fire();
    return { ok: true };
  } catch (e) { return { error: 'You already reported this photo.' }; }
}
