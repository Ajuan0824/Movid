"use client";

import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";

/** Sets up native-only chrome (status bar style, keyboard resize behaviour). Renders nothing. */
export function ClientBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Dark });
    void StatusBar.setOverlaysWebView({ overlay: true });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  }, []);

  return null;
}
