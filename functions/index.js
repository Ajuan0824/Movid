const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 400; // < 500 writes/batch

/**
 * Monday 00:00 UTC of the week containing `now`.
 * MUST stay identical to `currentPeriodStart` in lib/mevid/plan.ts.
 */
function currentPeriodStart(now = new Date()) {
  const midnightUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysSinceMonday = (new Date(midnightUtc).getUTCDay() + 6) % 7;
  return new Date(midnightUtc - daysSinceMonday * DAY_MS);
}

/**
 * Authoritative weekly star refill.
 *
 * The client also refills opportunistically (on load / focus), which covers
 * anyone actually using the app. This exists so a dormant account's doc is
 * still correct — useful once billing/reporting reads these numbers — and so
 * the reset doesn't depend on a client ever running.
 *
 * Runs 00:05 UTC every Monday (a few minutes past the boundary). Idempotent:
 * a refilled doc no longer matches `periodStart < period`, so a retry just
 * resumes on whatever is left.
 */
exports.weeklyStarRefill = onSchedule(
  { schedule: "5 0 * * 1", timeZone: "Etc/UTC", retryCount: 3 },
  async () => {
    const period = Timestamp.fromDate(currentPeriodStart());
    let processed = 0;
    let cursor = null;

    for (;;) {
      let query = db
        .collection("users")
        .where("periodStart", "<", period)
        .orderBy("periodStart")
        .limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);

      const snap = await query.get();
      if (snap.empty) break;

      const batch = db.batch();
      for (const document of snap.docs) {
        batch.update(document.ref, { starsUsed: 0, periodStart: period });
      }
      await batch.commit();

      processed += snap.size;
      cursor = snap.docs[snap.docs.length - 1];
      if (snap.size < PAGE_SIZE) break;
    }

    logger.info(`weeklyStarRefill: reset ${processed} account(s) to ${period.toDate().toISOString()}`);
  },
);
