import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes, uploadString } from "firebase/storage";
import { ensureFirebaseApp } from "./config";
import type { StoredGeneration, VideoHighlight } from "../mevid/types";

ensureFirebaseApp();

export const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

function generationsRef(uid: string) {
  return collection(getFirestore(), "users", uid, "generations");
}

/**
 * Generations live under a top-level `generations/` prefix rather than beside
 * the avatar in `users/{uid}/`, so the bucket's 30-day lifecycle rule can match
 * them by prefix without ever touching profile photos.
 */
function fileRef(uid: string, id: string, name: string) {
  return ref(getStorage(), `generations/${uid}/${id}/${name}`);
}

function momentName(index: number) {
  return `moment-${index}.jpg`;
}

export function isExpired(createdAt: Date, now = Date.now()) {
  return now - createdAt.getTime() > RETENTION_MS;
}

/**
 * The id is minted before the upload starts so the optimistic entry and the
 * stored one share it — otherwise the id would change underneath a user who is
 * looking at the result, and the detail view would drop back to the library.
 */
export function newGenerationId(uid: string) {
  return doc(generationsRef(uid)).id;
}

/**
 * Uploads the clip and its stills, then records the metadata. The video goes
 * first: if it fails there's nothing to clean up, whereas a doc written before
 * its files would leave a broken entry in the library.
 */
export async function saveGeneration(
  uid: string,
  id: string,
  input: { video: Blob; duration: number; trimStart: number; highlights: VideoHighlight[] },
): Promise<StoredGeneration> {
  const createdAt = new Date();

  const videoRef = fileRef(uid, id, "video");
  await uploadBytes(videoRef, input.video, { contentType: input.video.type || "video/mp4" });
  const videoUrl = await getDownloadURL(videoRef);

  const highlights: VideoHighlight[] = [];
  for (const [index, highlight] of input.highlights.entries()) {
    const imageRef = fileRef(uid, id, momentName(index));
    await uploadString(imageRef, highlight.image, "data_url");
    highlights.push({ ...highlight, image: await getDownloadURL(imageRef) });
  }

  await setDoc(doc(generationsRef(uid), id), {
    createdAt: Timestamp.fromDate(createdAt),
    expiresAt: Timestamp.fromDate(new Date(createdAt.getTime() + RETENTION_MS)),
    duration: input.duration,
    trimStart: input.trimStart,
    videoUrl,
    highlights,
  });

  return { id, createdAt, duration: input.duration, trimStart: input.trimStart, videoUrl, highlights };
}

/** Storage deletes are best-effort — a already-missing file (say, one the
 * bucket lifecycle rule already swept) shouldn't block removing the record. */
export async function deleteGeneration(uid: string, generation: StoredGeneration) {
  await Promise.allSettled([
    deleteObject(fileRef(uid, generation.id, "video")),
    ...generation.highlights.map((_, index) => deleteObject(fileRef(uid, generation.id, momentName(index)))),
  ]);
  await deleteDoc(doc(generationsRef(uid), generation.id));
}

/**
 * Returns the last 30 days of generations, newest first, and sweeps anything
 * past retention. The sweep runs here (rather than only on the server) so a
 * user's own expired clips are gone the next time they open the app.
 */
export async function listGenerations(uid: string): Promise<StoredGeneration[]> {
  const snapshot = await getDocs(query(generationsRef(uid), orderBy("createdAt", "desc")));

  const live: StoredGeneration[] = [];
  const expired: StoredGeneration[] = [];

  snapshot.forEach((entry) => {
    const data = entry.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0);
    const generation: StoredGeneration = {
      id: entry.id,
      createdAt,
      duration: typeof data.duration === "number" ? data.duration : 0,
      trimStart: typeof data.trimStart === "number" ? data.trimStart : 0,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      highlights: Array.isArray(data.highlights) ? (data.highlights as VideoHighlight[]) : [],
    };
    (isExpired(createdAt) ? expired : live).push(generation);
  });

  if (expired.length > 0) {
    void Promise.allSettled(expired.map((generation) => deleteGeneration(uid, generation)));
  }

  return live;
}
