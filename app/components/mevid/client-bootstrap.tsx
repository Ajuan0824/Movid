"use client";

import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { StatusBar } from "@capacitor/status-bar";
import { useEffect } from "react";

/**
 * Sets up native-only chrome (status bar overlay, keyboard resize behaviour).
 * The status bar *style* isn't set here — it has to follow the light/dark
 * theme, so `applyResolvedTheme` owns it. Renders nothing.
 */
export function ClientBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setOverlaysWebView({ overlay: true });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  }, []);

  return null;
}
