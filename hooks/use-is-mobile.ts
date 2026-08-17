"use client";

import { useEffect, useState } from "react";
import { isMobileContext } from "../lib/mevid/device";

export type MobileCheckState = "checking" | "mobile" | "desktop";

const RESIZE_DEBOUNCE_MS = 150;

/**
 * Hydration-safe mobile detection. Starts as "checking" so the server and
 * first client render match (no window/navigator access during SSR), then
 * resolves to "mobile" or "desktop" after mount. Re-evaluates on resize and
 * orientation change (debounced) in case the viewport or pointer type
 * changes, e.g. a foldable device or devtools resizing.
 */
export function useIsMobile(): MobileCheckState {
  const [state, setState] = useState<MobileCheckState>("checking");

  useEffect(() => {
    let debounceTimer: number | undefined;

    const evaluate = () => {
      setState(isMobileContext() ? "mobile" : "desktop");
    };

    const handleChange = () => {
      if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(evaluate, RESIZE_DEBOUNCE_MS);
    };

    evaluate();
    window.addEventListener("resize", handleChange);
    window.addEventListener("orientationchange", handleChange);

    return () => {
      if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("orientationchange", handleChange);
    };
  }, []);

  return state;
}
