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

/** iOS-style bouncy spring, used by the auth flow instead of the eased curves above. */
export const iosSpring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 32,
  mass: 0.9,
};

/** Push/pop transition between auth sub-screens (login <-> register <-> forgot password). */
export const authScreenTransition: Transition = iosSpring;

/** Horizontal push variants for auth screens; `custom` is +1 forward / -1 back. */
export const authScreenVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -28 : 28, scale: 0.98 }),
};
