"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./use-auth";
import { loadUserPlan, spendStar } from "../lib/firebase/firestore";
import { WEEKLY_STARS, type Plan } from "../lib/mevid/plan";

type PlanContextValue = {
  ready: boolean;
  /** The last plan load failed — stars are unknown, spending is blocked. */
  error: boolean;
  plan: Plan;
  limit: number;
  starsLeft: number;
  /** Returns false when there was nothing left to spend, so callers can show the empty modal. */
  spend: () => Promise<boolean>;
  /** Re-reads the plan doc (also rolls the weekly refill over). Safe to call anytime. */
  reload: () => void;
};

const FALLBACK: PlanContextValue = {
  ready: false,
  error: false,
  plan: "free",
  limit: WEEKLY_STARS.free,
  starsLeft: 0,
  spend: async () => false,
  reload: () => {},
};

const PlanContext = createContext<PlanContextValue>(FALLBACK);

/** How often a long-lived session re-checks for the weekly refill. */
const REFILL_POLL_MS = 10 * 60 * 1000;

export function PlanProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const uid = user?.uid ?? null;
  const email = user?.email ?? null;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");
  const [starsUsed, setStarsUsed] = useState(0);
  // Bumped to force a re-read (retry button, and the focus / interval checks).
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  // A re-read must not stomp on an optimistic spend that hasn't hit the server.
  const spendingRef = useRef(false);
  // Once we've had a good read, a failed background re-check keeps the last
  // known stars instead of blanking them.
  const loadedOkRef = useRef(false);

  useEffect(() => {
    if (status !== "signed-in" || !uid) {
      setReady(false);
      setError(false);
      loadedOkRef.current = false;
      return;
    }
    let active = true;
    void loadUserPlan(uid, email)
      .then((loaded) => {
        if (!active || spendingRef.current) return;
        loadedOkRef.current = true;
        setPlan(loaded.plan);
        setStarsUsed(loaded.starsUsed);
        setError(false);
        setReady(true);
      })
      .catch((loadError) => {
        console.error("Failed to load plan", loadError);
        if (!active) return;
        setReady(true);
        // Only surface an error (which blocks spending and shows a retry) when
        // we have nothing good to show. A failed background re-check keeps the
        // last known stars.
        setError((previous) => previous || !loadedOkRef.current);
      });
    return () => {
      active = false;
    };
  }, [status, uid, email, reloadKey]);

  // A long-lived session (PWA resumed, tab left open across Monday) otherwise
  // never picks up the weekly refill, because loadUserPlan only runs on a
  // fresh auth cycle. Re-check on focus and on a slow interval.
  useEffect(() => {
    if (status !== "signed-in" || !uid) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(reload, REFILL_POLL_MS);
    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [status, uid, reload]);

  const limit = WEEKLY_STARS[plan];
  const starsLeft = error ? 0 : Math.max(0, limit - starsUsed);

  const spend = useCallback(async () => {
    if (!uid || error || starsLeft <= 0) return false;
    // Optimistic: the star row updates immediately, and a rejected write rolls it back.
    spendingRef.current = true;
    setStarsUsed((current) => current + 1);
    try {
      await spendStar(uid);
      return true;
    } catch (spendError) {
      console.error("Failed to spend star", spendError);
      setStarsUsed((current) => Math.max(0, current - 1));
      return false;
    } finally {
      spendingRef.current = false;
    }
  }, [uid, error, starsLeft]);

  const value = useMemo(
    () => ({ ready, error, plan, limit, starsLeft, spend, reload }),
    [ready, error, plan, limit, starsLeft, spend, reload],
  );
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
