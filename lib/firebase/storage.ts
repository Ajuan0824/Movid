import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ensureFirebaseApp } from "./config";

ensureFirebaseApp();

/**
 * One folder per user, mirroring the `users/{uid}` collection in Firestore so
 * both consoles line up — and leaving room for other per-user files later.
 *
 * The filename is fixed and extension-less on purpose: a re-upload overwrites
 * the previous photo (the real format lives in the file's contentType) instead
 * of leaving an avatar.png next to an avatar.jpg.
 */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const storage = getStorage();
  const photoRef = ref(storage, `users/${uid}/avatar`);
  await uploadBytes(photoRef, file, { contentType: file.type });
  return getDownloadURL(photoRef);
}
