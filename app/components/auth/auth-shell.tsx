"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { authScreenTransition, tapScale } from "../../../lib/mevid/motion";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={authScreenTransition}
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8"
    >
      <div className="mb-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e5ddff] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#7657dd] shadow-[0_5px_18px_rgba(101,74,180,.08)]">
          <Sparkles size={13} />{eyebrow}
        </div>
        <h1 className="font-display text-3xl font-bold leading-[1.02] tracking-[-0.05em] text-[#232331]">{title}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#6d6b79]">{description}</p>
      </div>
      <div className="liquid-glass rounded-[30px] p-6">{children}</div>
      {footer ? <div className="mt-6 text-center text-sm text-[#6d6b79]">{footer}</div> : null}
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
      className="mb-4 rounded-2xl border border-[#ffc8d3] bg-[#fff3f6] px-4 py-2.5 text-sm font-medium text-[#9d3450]"
    >
      {message}
    </motion.p>
  );
}
