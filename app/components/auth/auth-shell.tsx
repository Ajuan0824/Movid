"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { authScreenTransition, tapScale } from "../../../lib/mevid/motion";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Shows a back chip above the title. The footer link alone isn't enough on a
   * long screen like register — it sits below the social buttons, off-screen on
   * a phone, so there's no visible way back until you scroll.
   */
  onBack?: () => void;
  backLabel?: string;
  /**
   * Tightens type and spacing. Register is the only screen long enough to run
   * past the bottom of a phone, and it has no scroll container to fall back on
   * (AuthGate replaces the app shell entirely when signed out).
   */
  compact?: boolean;
};

export function AuthShell({ title, description, children, footer, onBack, backLabel, compact = false }: AuthShellProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={authScreenTransition}
      className={`mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto ${compact ? "auth-compact pt-1" : "pt-2"} pb-[calc(0.5rem+env(safe-area-inset-bottom))]`}
    >
      {/* m-auto (not justify-center) so a screen taller than the viewport
          scrolls from the top instead of having its head clipped off. */}
      <div className="m-auto w-full">
      {onBack ? (
        <motion.button
          type="button"
          whileHover={{ x: -2 }}
          whileTap={{ scale: tapScale }}
          onClick={onBack}
          className={`${compact ? "mb-2.5" : "mb-4"} inline-flex items-center gap-1.5 self-start rounded-full border border-[#e2dcf5] bg-white/70 px-3.5 py-2 text-xs font-bold text-[#5c3fc4] shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#c4b3ff] dark:hover:bg-white/10`}
        >
          <ChevronLeft size={15} strokeWidth={2.8} />
          {backLabel}
        </motion.button>
      ) : null}
      <div className={compact ? "mb-3 text-center" : "mb-4 text-center"}>
        <h1 className="font-display text-[38px] font-bold leading-[1.02] tracking-[-0.05em] text-[#232331] dark:text-[#f1eff7]">{title}</h1>
        <p className={`mx-auto max-w-sm text-[#6d6b79] dark:text-[#a79fb5] ${compact ? "mt-1.5 text-sm leading-5" : "mt-2.5 text-base leading-6"}`}>{description}</p>
      </div>
      <div className={`liquid-glass rounded-[30px] ${compact ? "p-4" : "p-5"}`}>{children}</div>
      {footer ? <div className={`text-center text-[#6d6b79] dark:text-[#a79fb5] ${compact ? "mt-2.5 text-sm" : "mt-4 text-base"}`}>{footer}</div> : null}
      </div>
    </motion.section>
  );
}

type AuthSubmitButtonProps = {
  loading: boolean;
  onTap: () => void;
  children: ReactNode;
};

/** Primary submit button that cross-fades its label into a spinner while `loading`. */
export function AuthSubmitButton({ loading, onTap, children }: AuthSubmitButtonProps) {
  return (
    <motion.button
      whileTap={loading ? undefined : { scale: tapScale }}
      disabled={loading}
      onClick={onTap}
      type="submit"
      className="primary-button relative mt-1 w-full overflow-hidden disabled:opacity-90"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.span
              className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-4 rounded-2xl border border-[#ffc8d3] dark:border-[#5c2f3d] bg-[#fff3f6] dark:bg-[#2e2030] px-4 py-2.5 text-sm font-medium text-[#9d3450] dark:text-[#ffb4c8]"
    >
      {message}
    </motion.p>
  );
}
