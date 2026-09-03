"use client";

import { useCallback, useEffect, useState } from "react";
import { applyResolvedTheme, readStoredThemePref, resolveTheme, storeThemePref, type ThemePref } from "../lib/mevid/theme-pref";

/**
 * Theme preference state. The actual `dark` class flip already happened
 * synchronously in an inline script in <head> (see layout.tsx) to avoid a
 * flash of the wrong theme before hydration — this hook just keeps the
 * settings UI in sync and re-applies the class when the preference or the
 * OS-level scheme changes.
 */
export function useThemePref() {
  const [pref, setPrefState] = useState<ThemePref>("system");

  useEffect(() => {
    setPrefState(readStoredThemePref());
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolveTheme(pref));
    if (pref !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyResolvedTheme(resolveTheme("system"));
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    storeThemePref(next);
  }, []);

  return { pref, setPref };
}
