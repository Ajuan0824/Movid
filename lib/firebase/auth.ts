import {
  FirebaseAuthentication,
  type AuthCredential as PluginCredential,
  type User,
} from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  getAuth,
  onIdTokenChanged,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword as jsSignIn,
  signOut as jsSignOut,
} from "firebase/auth";
import { ensureFirebaseApp } from "./config";
import type { Locale } from "../mevid/types";

export type { User };

ensureFirebaseApp();

/**
 * We run the plugin with `skipNativeAuth: false`, so on iOS/Android a sign-in
 * only authenticates the *native* Firebase SDK. Everything else we touch
 * (Firestore, Storage) goes through the *JS* SDK, which would stay signed-out —
 * its requests then hit the security rules as an anonymous caller and fail with
 * "Missing or insufficient permissions".
 *
 * The fix (the plugin's own "use with the Firebase JS SDK" guide) is to mirror
 * every native sign-in onto the JS SDK. The JS SDK then persists its own
 * session in the WebView, so cold starts are covered too. On the web the plugin
 * already drives the JS SDK, so the extra calls below are harmless no-ops.
 */
function jsAuth() {
  return getAuth();
}

// localStorage-backed persistence is the one storage that's reliable inside the
// iOS WKWebView. Set it once, before any sign-in restores or runs.
const persistenceReady = setPersistence(jsAuth(), browserLocalPersistence).catch((error) => {
  console.error("Could not set Firebase JS auth persistence", error);
});

async function syncJsSignIn(run: () => Promise<unknown>) {
  await persistenceReady;
  try {
    await run();
  } catch (error) {
    // On the web the plugin already signed the JS SDK in, and an OAuth
    // credential is single-use — replaying it throws. If we're signed in, we're
    // where we want to be; only a genuine failure (no JS user) should surface.
    if (!jsAuth().currentUser) throw error;
    console.warn("JS SDK already signed in; ignoring sync error", error);
  }
}

function googleCredential(credential: PluginCredential | null) {
  if (!credential?.idToken && !credential?.accessToken) return null;
  return GoogleAuthProvider.credential(credential.idToken, credential.accessToken);
}

function appleCredential(credential: PluginCredential | null) {
  if (!credential?.idToken) return null;
  return new OAuthProvider("apple.com").credential({
    idToken: credential.idToken,
    rawNonce: credential.nonce,
  });
}

export async function signUpWithEmail(email: string, password: string) {
  const { user } = await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password });
  await syncJsSignIn(() => jsSignIn(jsAuth(), email, password));
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
  await syncJsSignIn(() => jsSignIn(jsAuth(), email, password));
  return user;
}

export async function signInWithGoogle() {
  const result = await FirebaseAuthentication.signInWithGoogle();
  const credential = googleCredential(result.credential);
  if (credential) await syncJsSignIn(() => signInWithCredential(jsAuth(), credential));
  return result.user;
}

export async function signInWithApple() {
  const result = await FirebaseAuthentication.signInWithApple();
  const credential = appleCredential(result.credential);
  if (credential) await syncJsSignIn(() => signInWithCredential(jsAuth(), credential));
  return result.user;
}

/**
 * Firebase ships its own localised default templates and picks one from the
 * language code, so setting it here is what makes the reset email arrive in
 * the language the person is actually using the app in. It also localises the
 * hosted page the link opens.
 */
export async function sendPasswordReset(email: string, locale: Locale) {
  try {
    await FirebaseAuthentication.setLanguageCode({ languageCode: locale });
  } catch (error) {
    // Not worth failing the reset over — it just falls back to English.
    console.error("Could not set the auth language", error);
  }
  await FirebaseAuthentication.sendPasswordResetEmail({ email });
}

export async function signOutUser() {
  await FirebaseAuthentication.signOut();
  await jsSignOut(jsAuth()).catch((error) => console.error("JS SDK sign-out failed", error));
}

export async function getCurrentUser() {
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return user;
}

export async function updateUserProfile(options: { displayName?: string; photoUrl?: string }) {
  await FirebaseAuthentication.updateProfile(options);
}

export function hasPasswordProvider(user: User) {
  return user.providerData.some((provider) => provider.providerId === "password");
}

/**
 * Firebase requires a "recent" sign-in before it allows a password change.
 * The plugin doesn't expose a reauthenticate call, so we re-run the
 * email/password sign-in right before updating — that refreshes recency.
 */
export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  await FirebaseAuthentication.signInWithEmailAndPassword({ email, password: currentPassword });
  await syncJsSignIn(() => jsSignIn(jsAuth(), email, currentPassword));
  await FirebaseAuthentication.updatePassword({ newPassword });
}

/**
 * Returns an unsubscribe function, mirroring the shape React effects expect.
 *
 * The JS SDK's token is what the Firestore/Storage rules authenticate against,
 * so its state — not the plugin's — decides whether we're "signed in". The
 * plugin still supplies the richer profile object the app renders. A native
 * session with no matching JS session (e.g. left over from a build before the
 * JS sync existed) reports signed-out, which prompts one clean re-login.
 *
 * If the listener itself fails to register, falls back to "signed out" instead
 * of leaving callers stuck on "loading".
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  let cancelled = false;

  const report = async () => {
    if (cancelled) return;
    if (!jsAuth().currentUser) {
      callback(null);
      return;
    }
    const { user } = await FirebaseAuthentication.getCurrentUser();
    if (!cancelled) callback(user);
  };

  const jsUnsub = onIdTokenChanged(jsAuth(), () => void report());

  const pluginHandle = FirebaseAuthentication.addListener("authStateChange", () => void report()).catch((error) => {
    console.error("Failed to start Firebase auth listener", error);
    callback(null);
    return undefined;
  });

  void report();

  return () => {
    cancelled = true;
    jsUnsub();
    void pluginHandle.then((handle) => handle?.remove());
  };
}
