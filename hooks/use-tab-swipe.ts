"use client";

import { useRef, type TouchEvent } from "react";

type SwipeStart = { x: number; y: number };

/** Horizontal finger swipes change one visible tab; vertical scrolling stays native. */
export function useTabSwipe<T extends string>({
  tab,
  tabs,
  onChange,
  ignoreSelector,
}: {
  tab: T;
  tabs: readonly T[];
  onChange: (tab: T) => void;
  ignoreSelector?: string;
}) {
  const start = useRef<SwipeStart | null>(null);

  return {
    onTouchStart(event: TouchEvent<HTMLElement>) {
      start.current = null;
      if (event.touches.length !== 1) return;
      if (
        ignoreSelector &&
        event.target instanceof Element &&
        event.target.closest(ignoreSelector)
      )
        return;
      start.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    },
    onTouchEnd(event: TouchEvent<HTMLElement>) {
      const origin = start.current;
      start.current = null;
      if (!origin || event.changedTouches.length !== 1) return;

      const dx = event.changedTouches[0].clientX - origin.x;
      const dy = event.changedTouches[0].clientY - origin.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.35) return;

      const index = tabs.indexOf(tab);
      const next = tabs[index + (dx < 0 ? 1 : -1)];
      if (!next || index < 0) return;
      // Cancels a synthetic click on a button under the finishing finger.
      event.preventDefault();
      onChange(next);
    },
    onTouchCancel() {
      start.current = null;
    },
  };
}
