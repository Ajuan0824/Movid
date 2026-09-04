"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Background of the "AI ready" viewfinder on the home screen: a slow cross-fade
 * through a handful of lively, people-in-motion shots (jumping, laughing,
 * dancing…). Purely decorative — `pointer-events-none` so taps fall through to
 * the record button behind it. Files live in `public/carousel/` (see CREDITS.md).
 */
const SHOTS = [
  "/carousel/01-laugh.jpg",
  "/carousel/02-jump.jpg",
  "/carousel/03-dance.jpg",
  "/carousel/04-smile.jpg",
  "/carousel/05-friends.jpg",
  "/carousel/06-forest.jpg",
];

/** How long each frame holds before the next fades in. */
const HOLD_MS = 3200;
const FADE_S = 1.1;

export function HeroCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SHOTS.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#252334]">
      <AnimatePresence initial={false}>
        <motion.img
          key={SHOTS[index]}
          src={SHOTS[index]}
          alt=""
          initial={{ opacity: 0, scale: reduce ? 1 : 1.14 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: FADE_S, ease: "easeInOut" },
            scale: { duration: HOLD_MS / 1000 + FADE_S, ease: "linear" },
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      {/* Keeps the white viewfinder chrome (label, timer, corners) legible over any frame. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45" />
    </div>
  );
}
