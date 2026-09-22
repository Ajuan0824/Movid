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
  // Client SDK modules are imported while Next prerenders client components.
  // Initialising Auth on the server makes `next build` require browser-only
  // public config and causes even the generated 404 page to fail. The browser
  // evaluates this module again and performs the real initialisation there.
  if (typeof window === "undefined") return;
  if (!getApps().length) initializeApp(firebaseConfig);
}
