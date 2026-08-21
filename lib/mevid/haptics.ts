import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/** Fires a light iOS-style tap haptic. No-ops on web/Android-without-support. */
export function tapHaptic(style: ImpactStyle = ImpactStyle.Light) {
  if (!Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style });
}
