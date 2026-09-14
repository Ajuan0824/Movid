import { getFunctions, httpsCallable } from "firebase/functions";
import { ensureFirebaseApp } from "./config";
import { signOutUser } from "./auth";

/** Must match the region the callable is deployed to in functions/index.js. */
const REGION = "us-central1";

/**
 * Permanent account deletion (App Store guideline 5.1.1(v)).
 *
 * The work happens in the `deleteAccount` Cloud Function, which takes the uid
 * from the verified ID token — the client can't ask it to delete anyone else.
 * Doing it server-side also gets around two client limits: Firestore
 * subcollections can't be deleted from the client in one go, and
 * `user.delete()` needs a recent sign-in and would fail for anyone who signed
 * in a while ago.
 *
 * Signs out afterwards so the app doesn't sit holding a token for a user that
 * no longer exists.
 */
export async function deleteAccount() {
  ensureFirebaseApp();
  await httpsCallable(getFunctions(undefined, REGION), "deleteAccount")();
  await signOutUser().catch(() => {
    // The account is already gone; a failed sign-out shouldn't look like a
    // failed deletion. onAuthStateChange settles it on the next token refresh.
  });
}
