"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Aperture } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * How long the splash holds before it starts leaving. Long enough for the
 * wordmark to finish settling, short enough not to feel like a wait.
 */
const HOLD_MS = 1500;

/**
 * Opening splash: the mark springs in like a camera iris, two rings bloom out
 * of it, and the wordmark's letter-spacing collapses into place. On the way out
 * the whole thing scales past the viewer and defocuses, so the app underneath
 * is revealed rather than swapped in.
 *
 * It renders visible on the server too, which is what hides the blank frame the
 * app used to show while the locale and mobile checks resolve after mount.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="splash"
          aria-hidden
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#f8f7fb] dark:bg-[#121018]"
          initial={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.08, filter: "blur(6px)" }}
          transition={{ duration: reduced ? 0.25 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="ambient-orb ambient-orb-left" />
          <div className="ambient-orb ambient-orb-right" />

          <div className="relative flex flex-col items-center">
            {/* Rings blooming out of the mark — the iris opening. */}
            {reduced
              ? null
              : [0, 1].map((index) => (
                  <motion.span
                    key={index}
                    className="pointer-events-none absolute top-0 h-[148px] w-[148px] rounded-[46px] border border-[#7657dd]/35"
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1.8, opacity: [0, 0.55, 0] }}
                    transition={{ duration: 1.3, delay: 0.28 + index * 0.32, ease: "easeOut" }}
                  />
                ))}

            <motion.div
              // On dark the mark is nearly the page colour, so it gets a hairline
              // ring and a violet bloom instead of the drop shadow that carries it
              // on light.
              className="grid h-[148px] w-[148px] place-items-center rounded-[46px] bg-[#252334] shadow-[0_30px_70px_rgba(36,29,80,.36)] dark:bg-[#2a2640] dark:shadow-[0_0_100px_rgba(118,87,221,.45)] dark:ring-1 dark:ring-inset dark:ring-white/10"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.62, y: 10, rotate: -22 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              transition={
                reduced
                  ? { duration: 0.3 }
                  : { type: "spring", stiffness: 250, damping: 19, mass: 0.9, delay: 0.08 }
              }
            >
              <Aperture size={76} strokeWidth={2.1} className="text-white" />
            </motion.div>

            <motion.p
              className="mt-8 font-display text-[56px] font-bold leading-none text-[#242432] dark:text-[#f2f0f8]"
              // The left padding cancels the trailing gap letter-spacing adds,
              // so the word stays optically centred while it tightens.
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 14, letterSpacing: "0.32em", paddingLeft: "0.32em" }
              }
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.06em", paddingLeft: "0em" }}
              transition={{ duration: 0.75, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              MoVid
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
