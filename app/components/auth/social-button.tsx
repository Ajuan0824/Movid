"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { tapScale } from "../../../lib/mevid/motion";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor" aria-hidden="true">
      <path d="M12.15 0c.1 1-.29 1.98-.86 2.7-.6.75-1.6 1.33-2.58 1.25-.12-.97.34-1.99.9-2.63C10.23.59 11.25.06 12.15 0Zm2.98 12.28c-.32.75-.47 1.08-.88 1.75-.57.94-1.38 2.1-2.38 2.11-.89.01-1.12-.58-2.32-.57-1.21 0-1.46.58-2.35.59-1 .01-1.76-1.06-2.33-2-1.6-2.61-1.77-5.67-.78-7.3.7-1.15 1.8-1.83 2.83-1.83 1.05 0 1.71.61 2.58.61.84 0 1.35-.61 2.58-.61.91 0 1.87.5 2.56 1.35-2.25 1.23-1.88 4.44.49 5.9Z" />
    </svg>
  );
}

type SocialButtonProps = {
  provider: "google" | "apple";
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SocialButton({ provider, children, onClick, disabled, loading }: SocialButtonProps) {
  const isApple = provider === "apple";
  return (
    <motion.button
      type="button"
      whileTap={loading ? undefined : { scale: tapScale }}
      disabled={disabled}
      onClick={() => {
        tapHaptic();
        onClick();
      }}
      className={`flex w-full items-center justify-center gap-2.5 rounded-full border px-5 py-3 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
        isApple ? "border-black bg-black text-white hover:bg-[#1a1a1a]" : "border-[#e2dfe8] dark:border-white/10 bg-white dark:bg-[#211e2c] text-[#3c3946] dark:text-[#ece9f4] hover:border-[#cfc8df]"
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ rotate: { duration: 0.7, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.15 } }}
            className={`inline-block h-4 w-4 rounded-full border-2 ${isApple ? "border-white/35 border-t-white" : "border-[#d8d5e1] border-t-[#7657dd]"}`}
          />
        ) : (
          <motion.span key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
            {isApple ? <AppleMark /> : <GoogleMark />}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
