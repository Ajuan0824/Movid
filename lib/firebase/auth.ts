import { FirebaseAuthentication, type User } from "@capacitor-firebase/authentication";
import { ensureFirebaseApp } from "./config";
import type { Locale } from "../mevid/types";

export type { User };

ensureFirebaseApp();

export async function signUpWithEmail(email: string, password: string) {
  const { user } = await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password });
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
  return user;
}

export async function signInWithGoogle() {
  const { user } = await FirebaseAuthentication.signInWithGoogle();
  return user;
}

export async function signInWithApple() {
  const { user } = await FirebaseAuthentication.signInWithApple();
  return user;
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
  await FirebaseAuthentication.updatePassword({ newPassword });
}

/**
 * Returns an unsubscribe function, mirroring the shape React effects expect.
 * If the listener itself fails to register (e.g. misconfigured Firebase env
 * vars), falls back to reporting "signed out" instead of leaving callers
 * stuck waiting forever on a "loading" state.
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const handlePromise = FirebaseAuthentication.addListener("authStateChange", (change) => {
    callback(change.user ?? null);
  }).catch((error) => {
    console.error("Failed to start Firebase auth listener", error);
    callback(null);
    return undefined;
  });
  return () => {
    void handlePromise.then((handle) => handle?.remove());
  };
}
