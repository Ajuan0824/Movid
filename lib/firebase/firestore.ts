import { Timestamp, doc, getDoc, getFirestore, increment, setDoc, updateDoc } from "firebase/firestore";
import { ensureFirebaseApp } from "./config";
import { currentPeriodStart, initialPlanFor, type Plan } from "../mevid/plan";

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
    await updateDoc(ref, { starsUsed: 0, periodStart: Timestamp.fromDate(period), ...emailPatch });
    return { plan, starsUsed: 0 };
  }

  if (Object.keys(emailPatch).length > 0) {
    await updateDoc(ref, emailPatch);
  }

  return { plan, starsUsed: typeof data.starsUsed === "number" ? data.starsUsed : 0 };
}

/**
 * Spends one star. Uses a server-side increment so two devices racing can't
 * both spend the same star; the rules cap the total at the plan's weekly limit.
 */
export async function spendStar(uid: string) {
  await updateDoc(userRef(uid), { starsUsed: increment(1) });
}
