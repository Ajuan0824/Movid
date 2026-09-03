import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "mevid-theme-pref";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  return pref === "system" ? getSystemTheme() : pref;
}

export function readStoredThemePref(): ThemePref {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function storeThemePref(pref: ThemePref): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, pref);
}

/**
 * Toggles the `dark` class on <html> — the single source of truth Tailwind's
 * dark: variant reads from — and keeps the native status bar legible.
 *
 * The status bar overlays the web view, so its text colour has to follow the
 * page behind it: `Style.Light` means *dark* glyphs (for our light background)
 * and `Style.Dark` means *light* glyphs. Pinning it to one value left the clock
 * and battery white-on-white in the light theme.
 */
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  if (!Capacitor.isNativePlatform()) return;
  void StatusBar.setStyle({ style: resolved === "dark" ? Style.Dark : Style.Light }).catch(() => {});
}
