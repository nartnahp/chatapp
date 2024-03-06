
import { browser } from '$app/environment';
import { firebaseConfig } from '$lib/env';
import { getApps, initializeApp } from 'firebase/app';

if (browser && !getApps().length) {
  initializeApp(firebaseConfig);
}
