"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Aperture } from "lucide-react";
import { useEffect, useState } from "react";
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(false),
      reduced ? 150 : 800,
    );
    return () => clearTimeout(timer);
  }, [reduced]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[var(--page-bg)]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-col items-center">
            <motion.span
              className="grid h-24 w-24 place-items-center rounded-[30px] bg-[#25352d] text-[#d4ed8a]"
              initial={reduced ? false : { rotate: -35, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            >
              <Aperture size={56} strokeWidth={1.3} />
            </motion.span>
            <p className="mt-5 font-display text-4xl font-semibold tracking-[-.07em]">
              MoVid.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
