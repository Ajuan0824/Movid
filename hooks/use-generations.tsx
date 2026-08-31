"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import { deleteGeneration, listGenerations, newGenerationId, saveGeneration } from "../lib/firebase/generations";
import type { StoredGeneration, VideoHighlight } from "../lib/mevid/types";

export function useGenerations() {
  const { status, user } = useAuth();
  const uid = user?.uid ?? null;

  const [generations, setGenerations] = useState<StoredGeneration[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "signed-in" || !uid) {
      setGenerations([]);
      setReady(false);
      return;
    }
    let active = true;
    void listGenerations(uid)
      .then((loaded) => {
        if (!active) return;
        setGenerations(loaded);
        setReady(true);
      })
      .catch((error) => {
        console.error("Failed to load generations", error);
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [status, uid]);

  /**
   * Shows the result straight away from local blobs and uploads in the
   * background — a 15s clip can take a while on mobile data, and making the
   * user stare at a spinner after they already waited for the analysis is
   * worse than letting the entry settle from `pending` a moment later.
   */
  const save = useCallback(
    (input: { video: Blob; duration: number; highlights: VideoHighlight[] }) => {
      const localId = uid ? newGenerationId(uid) : `pending-${Date.now()}`;
      // Its own object URL, not the one the home screen holds — that one gets
      // revoked by "start over" while this entry may still be uploading.
      const localVideoUrl = URL.createObjectURL(input.video);
      const optimistic: StoredGeneration = {
        id: localId,
        createdAt: new Date(),
        duration: input.duration,
        videoUrl: localVideoUrl,
        highlights: input.highlights,
        pending: true,
      };
      setGenerations((current) => [optimistic, ...current]);

      if (!uid) return localId;

      void saveGeneration(uid, localId, input)
        .then((stored) => {
          setGenerations((current) => current.map((entry) => (entry.id === localId ? stored : entry)));
        })
        .catch((error) => {
          console.error("Failed to save generation", error);
          // Drop the optimistic entry rather than leaving a card backed by a
          // blob that only exists in this tab.
          setGenerations((current) => current.filter((entry) => entry.id !== localId));
        })
        .finally(() => URL.revokeObjectURL(localVideoUrl));

      return localId;
    },
    [uid],
  );

  const remove = useCallback(
    async (generation: StoredGeneration) => {
      setGenerations((current) => current.filter((entry) => entry.id !== generation.id));
      if (!uid || generation.pending) return;
      try {
        await deleteGeneration(uid, generation);
      } catch (error) {
        console.error("Failed to delete generation", error);
      }
    },
    [uid],
  );

  return { generations, ready, save, remove };
}
