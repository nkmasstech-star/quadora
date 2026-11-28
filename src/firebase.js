// Firebase (web SDK) for the live Community and Poll. Config values are public identifiers, not secrets.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';

export const app = initializeApp({
  apiKey: 'AIzaSyB-F6_5oWWZK4v6n5krWUBNSQvIMMBHk5g', authDomain: 'qspot4d.firebaseapp.com', projectId: 'qspot4d',
  storageBucket: 'qspot4d.firebasestorage.app', messagingSenderId: '1012098386722', appId: '1:1012098386722:web:a7bbf88c78f2611e84f37b',
});
export const db = getFirestore(app);
export const auth = getAuth(app);

// Signs the web SDK in with the Google token the phone already got, so Firestore knows who is writing.
export async function webSignIn(idToken, accessToken) {
  const cred = GoogleAuthProvider.credential(idToken || null, accessToken || null);
  const r = await signInWithCredential(auth, cred);
  return r.user;
}
export const webSignOut = () => signOut(auth).catch(() => {});
