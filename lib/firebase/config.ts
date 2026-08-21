import { getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * @capacitor-firebase/authentication expects a firebase/app instance to
 * already exist on web (native platforms use their own native SDK instead).
 * Guarded against double-init because Next.js can re-evaluate this module
 * during fast refresh.
 */
export function ensureFirebaseApp() {
  if (!getApps().length) initializeApp(firebaseConfig);
}
