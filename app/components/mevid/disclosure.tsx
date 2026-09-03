"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ReactNode, RefObject } from "react";

/** Snappy on the way open — it starts fast and settles. */
const EASE_OPEN = [0.22, 1, 0.36, 1] as const;
/** Symmetric ease on the way closed. The expo curve above collapses almost
 *  everything in the first frames, which reads as the panel snapping shut. */
const EASE_CLOSE = [0.4, 0, 0.2, 1] as const;

export const DISCLOSURE_DURATION = 0.36;

type DisclosureProps = {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  sectionRef?: RefObject<HTMLDivElement | null>;
  /** Fires once the open animation has settled and the height is final. */
  onOpened?: () => void;
  children: ReactNode;
};

/**
 * Collapsible section inside a settings card. Deliberately has no hover or
 * pressed background: on a phone `:hover` sticks after a tap, which left the
 * row looking permanently highlighted.
 *
 * `inert` keeps the collapsed fields out of the tab order without swapping
 * `display`, which would kill the height animation.
 */
export function Disclosure({ icon, label, open, onToggle, sectionRef, onOpened, children }: DisclosureProps) {
  return (
    <div ref={sectionRef}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-3 text-left transition-opacity active:opacity-60"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0ecff] text-[#7657dd] dark:bg-[#2c2740] dark:text-[#c4b3ff]">
            {icon}
          </span>
          <span className="text-base font-bold text-[#242432] dark:text-[#f2f0f8]">{label}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: DISCLOSURE_DURATION, ease: EASE_CLOSE }}
          className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]"
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{
          height: { duration: DISCLOSURE_DURATION, ease: open ? EASE_OPEN : EASE_CLOSE },
          // Fades across most of the collapse instead of blinking out early.
          opacity: { duration: open ? 0.26 : 0.28, delay: open ? 0.08 : 0 },
        }}
        className="overflow-hidden"
        inert={!open}
        // Waiting for the real end of the animation, not a timer: `height:
        // auto` only reaches its final value on the last frame, and measuring
        // early left the panel scrolled short of its own submit button.
        onAnimationComplete={() => {
          if (open) onOpened?.();
        }}
      >
        <div className="px-1 pb-1 pt-1">{children}</div>
      </motion.div>
    </div>
  );
}

/**
 * Scrolls just enough to bring the whole opened section into view. The tab bar
 * floats over the bottom of the scroll container, so aiming at the container's
 * own edge would park the submit button underneath it.
 */
export function revealInView(element: HTMLDivElement | null) {
  if (!element) return;
  const scroller = element.closest<HTMLElement>(".overflow-y-auto");
  if (!scroller) return;
  const nav = document.querySelector("nav");
  const floor = nav ? nav.getBoundingClientRect().top : scroller.getBoundingClientRect().bottom;
  const overflow = element.getBoundingClientRect().bottom - floor + 16;
  if (overflow > 0) scroller.scrollBy({ top: overflow, behavior: "smooth" });
}
