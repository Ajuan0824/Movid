"use client";

import { useCallback, useEffect, useState } from "react";
import { getSystemLocale, type LocalePref, readStoredLocalePref, resolveLocale, storeLocalePref } from "../lib/mevid/locale-pref";
import type { Locale } from "../lib/mevid/types";

/**
 * Hydration-safe locale preference. Starts as English/"system" (matching the
 * server render), then resolves the stored preference (or the device
 * language) after mount. `ready` flips once that resolution has happened, so
 * callers can hold off rendering localized text until it reflects the real
 * preference instead of flashing the SSR default.
 */
export function useLocalePref() {
  const [pref, setPrefState] = useState<LocalePref>("system");
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocalePref();
    setPrefState(stored);
    setLocale(resolveLocale(stored));
    setReady(true);
  }, []);

  useEffect(() => {
    if (pref !== "system") return;
    const handleChange = () => setLocale(getSystemLocale());
    window.addEventListener("languagechange", handleChange);
    return () => window.removeEventListener("languagechange", handleChange);
  }, [pref]);

  const setPref = useCallback((next: LocalePref) => {
    setPrefState(next);
    storeLocalePref(next);
    setLocale(resolveLocale(next));
  }, []);

  return { pref, locale, setPref, ready };
}
