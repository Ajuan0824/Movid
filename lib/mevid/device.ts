export const DESKTOP_WIDTH_THRESHOLD = 1024;

const MOBILE_UA_PATTERN = /android|iphone|ipod|ipad|iemobile|opera mini|mobile|windows phone|blackberry|bb10|webos/i;

/**
 * Evaluates a user-agent string only. Does not consider viewport or pointer
 * type — the modern iPad (which reports a desktop Mac UA) is intentionally
 * NOT detected here; that heuristic (navigator.maxTouchPoints) belongs in the
 * hook layer, combined with viewport/pointer checks.
 */
export function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_UA_PATTERN.test(userAgent);
}

/**
 * True when the viewport is narrow enough AND the primary pointer is coarse
 * (touch-like). A wide touch screen (e.g. a desktop with a touch monitor)
 * should not be treated as mobile, hence the width check.
 */
export function isMobileViewport(width: number, hasCoarsePointer: boolean): boolean {
  return hasCoarsePointer && width <= DESKTOP_WIDTH_THRESHOLD;
}

/**
 * Combines user-agent, viewport width and pointer coarseness to decide
 * whether the current runtime context is "mobile enough" to use the app.
 * Safe to call during SSR — returns false when window/navigator are missing.
 */
export function isMobileContext(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return isMobileUserAgent(navigator.userAgent) || isMobileViewport(window.innerWidth, hasCoarsePointer);
}
