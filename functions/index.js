const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
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

/**
 * RevenueCat webhook -> Firestore plan flip.
 *
 * RevenueCat is the source of truth for "is this account subscribed". It posts
 * an event here on every purchase / renewal / expiration; we translate that to
 * `users/{uid}.plan` ('pro' | 'free'), which is what firestore.rules and the
 * app read to decide the weekly star limit.
 *
 * app_user_id MUST be the Firebase uid — the client passes it to
 * Purchases.configure({ appUserID: user.uid }). Anonymous ids (a user who
 * bought before signing in — shouldn't happen in this app) are ignored.
 *
 * Auth: RevenueCat sends the exact string configured in its dashboard as the
 * Authorization header; we reject anything else. Set it with:
 *   firebase functions:secrets:set RC_WEBHOOK_AUTH
 */
const RC_WEBHOOK_AUTH = defineSecret("RC_WEBHOOK_AUTH");

// Entitlement identifier configured in RevenueCat (Product catalog -> Entitlements).
const PRO_ENTITLEMENT = "pro";

// Event types that mean "this account currently has access".
const GRANTS_ACCESS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "NON_RENEWING_PURCHASE",
]);
// Event types that mean "access just ended". CANCELLATION and BILLING_ISSUE
// deliberately aren't here: access continues until an EXPIRATION arrives.
const REVOKES_ACCESS = new Set(["EXPIRATION"]);

function entitlementInEvent(event) {
  const ids = event.entitlement_ids || (event.entitlement_id ? [event.entitlement_id] : []);
  // Older payloads omit entitlement info; treat that as "our only entitlement".
  return ids.length === 0 || ids.includes(PRO_ENTITLEMENT);
}

/** 'pro' | 'free' | null (no change) for a single event. */
function planForEvent(event) {
  if (!entitlementInEvent(event)) return null;
  if (GRANTS_ACCESS.has(event.type)) return "pro";
  if (REVOKES_ACCESS.has(event.type)) return "free";
  return null;
}

function isRealUid(appUserId) {
  return typeof appUserId === "string" && appUserId.length > 0 && !appUserId.startsWith("$RCAnonymousID:");
}

/**
 * Writes `plan` without disturbing the star fields. The plan doc's allowed
 * shape (firestore.rules `validShape`) is exactly
 * ['plan', 'starsUsed', 'periodStart', 'email'] — so a later client write
 * breaks if we add any other key. Anything RevenueCat-specific goes in the
 * separate `billing/{uid}` doc instead.
 */
async function setPlan(uid, plan, event) {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  if (snap.exists) {
    if (snap.get("plan") !== plan) {
      await userRef.update({ plan });
      logger.info(`revenuecatWebhook: ${uid} -> ${plan} (${event.type})`);
    }
  } else {
    // No plan doc yet (bought before first sign-in wrote it): create a
    // complete one so the client's refill/spend writes stay rule-valid.
    await userRef.set({
      plan,
      starsUsed: 0,
      periodStart: Timestamp.fromDate(currentPeriodStart()),
    });
    logger.info(`revenuecatWebhook: created ${uid} as ${plan} (${event.type})`);
  }

  await db.collection("billing").doc(uid).set(
    {
      store: event.store || null,
      productId: event.product_id || null,
      entitlement: PRO_ENTITLEMENT,
      lastEventType: event.type,
      lastEventAt: Timestamp.now(),
      expiresAt: event.expiration_at_ms ? Timestamp.fromMillis(event.expiration_at_ms) : null,
      periodType: event.period_type || null,
    },
    { merge: true },
  );
}

exports.revenuecatWebhook = onRequest(
  { secrets: [RC_WEBHOOK_AUTH], region: "us-central1", invoker: "public" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    if (req.get("Authorization") !== RC_WEBHOOK_AUTH.value()) {
      logger.warn("revenuecatWebhook: bad Authorization header");
      res.status(401).send("Unauthorized");
      return;
    }

    const event = req.body && req.body.event;
    if (!event || !event.type) {
      res.status(400).send("No event");
      return;
    }

    try {
      // A subscription moving between accounts (rare — same Apple ID, new login).
      if (event.type === "TRANSFER") {
        const to = event.transferred_to || [];
        const from = event.transferred_from || [];
        await Promise.all([
          ...to.filter(isRealUid).map((uid) => setPlan(uid, "pro", event)),
          ...from.filter(isRealUid).map((uid) => setPlan(uid, "free", event)),
        ]);
        res.status(200).send("ok");
        return;
      }

      if (!isRealUid(event.app_user_id)) {
        logger.info(`revenuecatWebhook: ignoring anonymous app_user_id (${event.type})`);
        res.status(200).send("ignored");
        return;
      }

      const plan = planForEvent(event);
      if (plan) await setPlan(event.app_user_id, plan, event);
      else logger.info(`revenuecatWebhook: no-op for ${event.type} (${event.app_user_id})`);

      res.status(200).send("ok");
    } catch (error) {
      logger.error("revenuecatWebhook failed", error);
      // 5xx tells RevenueCat to retry (it backs off for up to ~72h).
      res.status(500).send("error");
    }
  },
);
