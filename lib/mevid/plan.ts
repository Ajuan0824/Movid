export type Plan = "free" | "pro";

/** Stars = one video generation each. Refilled at the start of every week. */
export const WEEKLY_STARS: Record<Plan, number> = { free: 3, pro: 7 };

/**
 * Accounts that already existed when plans launched keep pro.
 *
 * Mirrored in firestore.rules, which is what actually enforces it — this copy
 * only lets the client propose the right plan when it first creates the doc.
 * Both go away together once billing decides who is pro.
 */
const FOUNDING_UIDS = [
  "KoFeNo6vLrN86icpfq5hIGQyJ9R2",
  "PYSrLPCbufbOClv2KIoInhsWv683",
  "pn5PjFMHwWdaBCFrJl5woMDNL6K2",
];

export function initialPlanFor(uid: string): Plan {
  return FOUNDING_UIDS.includes(uid) ? "pro" : "free";
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/**
 * Start of the current week (Monday 00:00 UTC).
 *
 * Everyone refills on the same boundary, and consecutive boundaries are
 * exactly 7 days apart — which is what the Firestore rules lean on to reject
 * an early refill: a new periodStart must be >= the stored one + 7 days.
 */
export function currentPeriodStart(now: Date = new Date()): Date {
  const midnightUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysSinceMonday = (new Date(midnightUtc).getUTCDay() + 6) % 7;
  return new Date(midnightUtc - daysSinceMonday * DAY_MS);
}

/** When the current period's stars come back — shown in the "out of stars" modal. */
export function nextPeriodStart(now: Date = new Date()): Date {
  return new Date(currentPeriodStart(now).getTime() + WEEK_MS);
}
