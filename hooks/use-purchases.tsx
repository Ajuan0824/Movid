"use client";

import { Capacitor } from "@capacitor/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./use-auth";
import { usePlan } from "./use-plan";

// RevenueCat entitlement identifier (Product catalog -> Entitlements). Must
// match the string the webhook checks in functions/index.js.
const PRO_ENTITLEMENT = "pro";

// Public, app-specific SDK key from RevenueCat (API keys -> "Public app-specific
// API key" for the App Store app). Starts with `appl_`. Safe to ship.
const IOS_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? "";

export type PurchaseOutcome = "ok" | "cancelled" | "unavailable" | "error";
export type RestoreOutcome = "restored" | "nothing" | "unavailable" | "error";

type PurchasesContextValue = {
  /** The store SDK can run here (native iOS build with a key configured). */
  available: boolean;
  /** configure() + first getOfferings() have settled (ok or failed). */
  ready: boolean;
  /** RevenueCat says the `pro` entitlement is active right now. */
  entitledPro: boolean;
  /** A purchase/restore is in flight, or we're waiting for the webhook to land. */
  busy: boolean;
  /**
   * The current offering actually carries a monthly package. False means the
   * RevenueCat dashboard has no product wired to its current offering (SDK
   * error 23), so there is nothing to buy — don't offer a CTA that must fail.
   */
  hasOffering: boolean;
  /** Localised price of the monthly package, straight from the store. */
  monthlyPrice: string | null;
  subscribe: () => Promise<PurchaseOutcome>;
  restore: () => Promise<RestoreOutcome>;
};

const FALLBACK: PurchasesContextValue = {
  available: false,
  ready: false,
  entitledPro: false,
  busy: false,
  hasOffering: false,
  monthlyPrice: null,
  subscribe: async () => "unavailable",
  restore: async () => "unavailable",
};

const PurchasesContext = createContext<PurchasesContextValue>(FALLBACK);

// Loaded lazily so the plugin's native bridge is only pulled in where it exists.
type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");
let modulePromise: Promise<PurchasesModule> | null = null;
function loadPurchases() {
  modulePromise ??= import("@revenuecat/purchases-capacitor");
  return modulePromise;
}

// configure() must run exactly once per app launch; logIn() handles later
// account switches.
let configuredForUid: string | null = null;

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { reload: reloadPlan } = usePlan();

  const available = useMemo(
    () => IOS_API_KEY !== "" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios",
    [],
  );

  const [ready, setReady] = useState(!available);
  const [entitledPro, setEntitledPro] = useState(false);
  const [busy, setBusy] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);
  const [hasOffering, setHasOffering] = useState(false);

  // Keep the latest reloadPlan without making the poller depend on it.
  const reloadPlanRef = useRef(reloadPlan);
  reloadPlanRef.current = reloadPlan;

  /** Nudge the plan doc to re-read until the webhook has flipped it to pro. */
  const pollPlan = useCallback(() => {
    reloadPlanRef.current();
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      reloadPlanRef.current();
      if (ticks >= 10) {
        window.clearInterval(id);
        setBusy(false);
      }
    }, 2000);
  }, []);

  const applyOfferings = useCallback((offering: import("@revenuecat/purchases-capacitor").PurchasesOffering | null) => {
    setMonthlyPrice(offering?.monthly?.product.priceString ?? null);
    setHasOffering(Boolean(offering?.monthly));
  }, []);

  useEffect(() => {
    if (!available || !uid) return;
    let cancelled = false;

    void (async () => {
      try {
        const { Purchases, LOG_LEVEL } = await loadPurchases();

        if (configuredForUid === null) {
          await Purchases.setLogLevel({ level: process.env.NODE_ENV === "production" ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN });
          await Purchases.configure({ apiKey: IOS_API_KEY, appUserID: uid });
          configuredForUid = uid;
          await Purchases.addCustomerInfoUpdateListener((info) => {
            setEntitledPro(PRO_ENTITLEMENT in info.entitlements.active);
          });
        } else if (configuredForUid !== uid) {
          await Purchases.logIn({ appUserID: uid });
          configuredForUid = uid;
        }

        const { customerInfo } = await Purchases.getCustomerInfo();
        if (!cancelled) setEntitledPro(PRO_ENTITLEMENT in customerInfo.entitlements.active);

        const offerings = await Purchases.getOfferings();
        if (!cancelled) applyOfferings(offerings.current);
      } catch (error) {
        console.error("RevenueCat init failed", error);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [available, uid, applyOfferings]);

  const subscribe = useCallback<PurchasesContextValue["subscribe"]>(
    async () => {
      if (!available) return "unavailable";
      setBusy(true);
      try {
        const { Purchases } = await loadPurchases();
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.monthly;
        if (!pkg) {
          setBusy(false);
          return "error";
        }

        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        const nowPro = PRO_ENTITLEMENT in customerInfo.entitlements.active;
        setEntitledPro(nowPro);
        // The webhook writes users/{uid}.plan; keep `busy` until the client
        // sees it (pollPlan clears it), so the UI doesn't flip back and forth.
        if (nowPro) pollPlan();
        else setBusy(false);
        return "ok";
      } catch (error) {
        setBusy(false);
        const e = error as { code?: string; userCancelled?: boolean | null };
        if (e?.userCancelled || e?.code === "1") return "cancelled";
        console.error("RevenueCat purchase failed", error);
        return "error";
      }
    },
    [available, pollPlan],
  );

  const restore = useCallback<PurchasesContextValue["restore"]>(async () => {
    if (!available) return "unavailable";
    setBusy(true);
    try {
      const { Purchases } = await loadPurchases();
      const { customerInfo } = await Purchases.restorePurchases();
      const nowPro = PRO_ENTITLEMENT in customerInfo.entitlements.active;
      setEntitledPro(nowPro);
      if (nowPro) {
        pollPlan();
        return "restored";
      }
      setBusy(false);
      return "nothing";
    } catch (error) {
      setBusy(false);
      console.error("RevenueCat restore failed", error);
      return "error";
    }
  }, [available, pollPlan]);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      available,
      ready,
      entitledPro,
      busy,
      hasOffering,
      monthlyPrice,
      subscribe,
      restore,
    }),
    [available, ready, entitledPro, busy, hasOffering, monthlyPrice, subscribe, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  return useContext(PurchasesContext);
}
