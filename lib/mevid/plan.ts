export type Plan = "free" | "pro";

export type PlanLimits = {
  /** Stars = one video generation each. Refilled at the start of every week. */
  stars: number;
  /** How many moments the AI is asked to return per video. */
  moments: number;
  /** Longest window that gets analysed; longer uploads are trimmed down to it. */
  videoSeconds: number;
  /** Frames sampled from that window and handed to the model. */
  frames: number;
};

/**
 * Everything a plan buys, in one place — the app reads all four numbers from
 * here so a tier change is a single edit.
 *
 * Only `stars` is enforced server-side (firestore.rules `limitFor`, which must
 * be kept in sync). The rest are client-declared: `/api/analyze` trusts the
 * plan the client sends, because the expensive part — burning a star — is
 * already gated by the rules, so the worst a forged "pro" buys is a slightly
 * richer analysis of a run they still paid a star for.
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { stars: 3, moments: 5, videoSeconds: 15, frames: 16 },
  pro: { stars: 15, moments: 10, videoSeconds: 30, frames: 24 },
};

export function limitsFor(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/** Stars = one video generation each. Refilled at the start of every week. */
export const WEEKLY_STARS: Record<Plan, number> = {
  free: PLAN_LIMITS.free.stars,
  pro: PLAN_LIMITS.pro.stars,
};

/**
 * The widest window any plan can analyse. Used for clamps that run before the
 * plan is known (formatting a timer, sizing the trimmer's ceiling).
 */
export const MAX_PLAN_VIDEO_SECONDS = PLAN_LIMITS.pro.videoSeconds;

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
