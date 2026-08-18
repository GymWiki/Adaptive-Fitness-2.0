import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** True once every required Firebase config value is actually set — false on a fresh checkout before .env/Vercel is configured. */
export function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every(Boolean)
}

// Initialized once at module load — ES modules are cached, so every
// importer shares this same app/auth/db instance rather than re-initializing.
// getAuth()/getFirestore() throw synchronously on an invalid/empty apiKey
// (unlike initializeApp, which never validates), so they're only called once
// config is actually present — auth/db stay null otherwise. Every caller
// must check hasFirebaseConfig() before touching either (AuthContext does).
const app = initializeApp(firebaseConfig)

export const auth: Auth | null = hasFirebaseConfig() ? getAuth(app) : null
export const db: Firestore | null = hasFirebaseConfig() ? getFirestore(app) : null
