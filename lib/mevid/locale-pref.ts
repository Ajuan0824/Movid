import type { Locale } from "./types";

export type LocalePref = "system" | Locale;

const STORAGE_KEY = "mevid-locale-pref";

/** Reads the browser/OS language and maps it to a supported app locale. */
export function getSystemLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const candidates = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  const primary = (candidates[0] ?? "en").toLowerCase();
  return primary.startsWith("es") ? "es" : "en";
}

export function resolveLocale(pref: LocalePref): Locale {
  return pref === "system" ? getSystemLocale() : pref;
}

export function readStoredLocalePref(): LocalePref {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "es" || stored === "en" || stored === "system" ? stored : "system";
}

export function storeLocalePref(pref: LocalePref): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, pref);
}
