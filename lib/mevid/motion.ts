import type { Transition, Variants } from "framer-motion";

/** Shared transition for screen-to-screen changes inside the root AnimatePresence. */
export const screenTransition: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

/** Container variants for the results moments list — staggers its children in. */
export const resultsListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Item variants for each moment card/button inside the results list. */
export const resultsItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** Container variants for a screen's header text block (eyebrow -> title -> subtitle). */
export const heroTextVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.06,
    },
  },
};

/** Item variants for each element (eyebrow, title, subtitle) inside a header text block. */
export const heroTextItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

/** Scale applied to interactive buttons on tap for tactile feedback. */
export const tapScale = 0.96;
