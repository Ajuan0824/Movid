import { FirebaseAuthentication, type User } from "@capacitor-firebase/authentication";
import { ensureFirebaseApp } from "./config";

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

export async function sendPasswordReset(email: string) {
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

/** Returns an unsubscribe function, mirroring the shape React effects expect. */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const handlePromise = FirebaseAuthentication.addListener("authStateChange", (change) => {
    callback(change.user ?? null);
  });
  return () => {
    void handlePromise.then((handle) => handle.remove());
  };
}
