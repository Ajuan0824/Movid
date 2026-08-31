"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./use-auth";
import { loadUserPlan, spendStar } from "../lib/firebase/firestore";
import { WEEKLY_STARS, type Plan } from "../lib/mevid/plan";

type PlanContextValue = {
  ready: boolean;
  plan: Plan;
  limit: number;
  starsLeft: number;
  /** Returns false when there was nothing left to spend, so callers can show the empty modal. */
  spend: () => Promise<boolean>;
};

const FALLBACK: PlanContextValue = {
  ready: false,
  plan: "free",
  limit: WEEKLY_STARS.free,
  starsLeft: 0,
  spend: async () => false,
};

const PlanContext = createContext<PlanContextValue>(FALLBACK);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const uid = user?.uid ?? null;
  const email = user?.email ?? null;

  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");
  const [starsUsed, setStarsUsed] = useState(0);

  useEffect(() => {
    if (status !== "signed-in" || !uid) {
      setReady(false);
      return;
    }
    let active = true;
    void loadUserPlan(uid, email)
      .then((loaded) => {
        if (!active) return;
        setPlan(loaded.plan);
        setStarsUsed(loaded.starsUsed);
        setReady(true);
      })
      .catch((error) => {
        console.error("Failed to load plan", error);
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [status, uid, email]);

  const limit = WEEKLY_STARS[plan];
  const starsLeft = Math.max(0, limit - starsUsed);

  const spend = useCallback(async () => {
    if (!uid || starsLeft <= 0) return false;
    // Optimistic: the star row updates immediately, and a rejected write rolls it back.
    setStarsUsed((current) => current + 1);
    try {
      await spendStar(uid);
      return true;
    } catch (error) {
      console.error("Failed to spend star", error);
      setStarsUsed((current) => Math.max(0, current - 1));
      return false;
    }
  }, [uid, starsLeft]);

  const value = useMemo(
    () => ({ ready, plan, limit, starsLeft, spend }),
    [ready, plan, limit, starsLeft, spend],
  );
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
