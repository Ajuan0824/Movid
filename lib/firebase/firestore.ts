import { Timestamp, doc, getDoc, getFirestore, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import { ensureFirebaseApp } from "./config";
import { currentPeriodStart, initialPlanFor, WEEKLY_STARS, type Plan } from "../mevid/plan";

ensureFirebaseApp();

export type UserPlan = {
  plan: Plan;
  starsUsed: number;
};

function userRef(uid: string) {
  return doc(getFirestore(), "users", uid);
}

/**
 * Reads the user's plan doc, creating it on first sign-in and rolling the
 * weekly refill over when a new period has started. `plan` can never be
 * changed by the client once the doc exists (see firestore.rules), and the
 * plan claimed at creation is validated server-side too.
 *
 * `email` is stored purely so the Firestore console is readable — the rules
 * pin it to the signed-in token's email, so it can't be spoofed.
 */
export async function loadUserPlan(uid: string, email: string | null): Promise<UserPlan> {
  const ref = userRef(uid);
  const snapshot = await getDoc(ref);
  const period = currentPeriodStart();

  if (!snapshot.exists()) {
    const plan = initialPlanFor(uid);
    await setDoc(ref, {
      plan,
      starsUsed: 0,
      periodStart: Timestamp.fromDate(period),
      ...(email ? { email } : {}),
    });
    return { plan, starsUsed: 0 };
  }

  const data = snapshot.data();
  const plan: Plan = data.plan === "pro" ? "pro" : "free";
  const storedPeriod = data.periodStart instanceof Timestamp ? data.periodStart.toDate() : new Date(0);
  // Backfills docs created before `email` existed, and follows an email change.
  const emailPatch = email && data.email !== email ? { email } : {};

  if (storedPeriod.getTime() < period.getTime()) {
    // New week — the stars are back. `weeklyStarRefill` (Cloud Function) is the
    // authoritative writer; this is a best-effort nudge so the doc is fresh
    // between sweeps, and its failure must not block the user.
    void updateDoc(ref, { starsUsed: 0, periodStart: Timestamp.fromDate(period), ...emailPatch }).catch((error) =>
      console.error("Weekly refill nudge failed (harmless — the scheduled job will catch up)", error),
    );
    return { plan, starsUsed: 0 };
  }

  if (Object.keys(emailPatch).length > 0) {
    await updateDoc(ref, emailPatch);
  }

  return { plan, starsUsed: typeof data.starsUsed === "number" ? data.starsUsed : 0 };
}

/**
 * Spends one star inside a transaction, so two devices racing can't both spend
 * the same one (Firestore retries the transaction on contention). If the stored
 * week is already over — the refill, client- or server-side, hasn't landed yet
 * — this rolls the period over and counts the first star in a single write.
 * Throws when there's nothing left; the rules also cap it at the weekly limit.
 */
export async function spendStar(uid: string) {
  const ref = userRef(uid);
  await runTransaction(getFirestore(), async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error("plan doc missing");

    const data = snapshot.data();
    const plan: Plan = data.plan === "pro" ? "pro" : "free";
    const limit = WEEKLY_STARS[plan];
    const period = currentPeriodStart();
    const storedPeriod = data.periodStart instanceof Timestamp ? data.periodStart.toDate() : new Date(0);

    if (storedPeriod.getTime() < period.getTime()) {
      tx.update(ref, { starsUsed: 1, periodStart: Timestamp.fromDate(period) });
      return;
    }

    const used = typeof data.starsUsed === "number" ? data.starsUsed : 0;
    if (used >= limit) throw new Error("no stars left");
    tx.update(ref, { starsUsed: used + 1 });
  });
}
