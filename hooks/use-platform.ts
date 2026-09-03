"use client";

import { useState } from "react";
import { getPlatform, type Platform } from "../lib/mevid/platform";

/**
 * Resolved once on first render. The auth screens only ever mount on the
 * client (page.tsx holds everything back until the mobile check resolves), so
 * reading it eagerly is safe and avoids the Apple button flashing in or out
 * after a first paint.
 */
export function usePlatform(): Platform {
  const [platform] = useState(getPlatform);
  return platform;
}
