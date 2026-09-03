import { Capacitor } from "@capacitor/core";

export type Platform = "ios" | "android" | "web";

/**
 * In a native build Capacitor answers directly. On the web — including the
 * WebView while it points at the dev server over the network — it reports
 * "web", so the user agent decides instead.
 *
 * Safe during SSR: returns "web" when there's no navigator.
 */
export function getPlatform(): Platform {
  const native = Capacitor.getPlatform();
  if (native === "ios" || native === "android") return native;

  if (typeof navigator === "undefined") return "web";
  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  if (/iphone|ipad|ipod/i.test(agent)) return "ios";
  return "web";
}

/**
 * Sign in with Apple is hidden on Android, where an Apple ID is the wrong
 * thing to ask for. It stays everywhere else — and on iOS it's not optional:
 * App Store guideline 4.8 requires it whenever other third-party sign-in is
 * offered.
 */
export function supportsAppleSignIn(platform: Platform) {
  return platform !== "android";
}
