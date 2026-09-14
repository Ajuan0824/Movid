"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";

type ToastProps = {
  tone: "error" | "notice";
  message: string;
  closeLabel: string;
  onDismiss: () => void;
};

export function Toast({ tone, message, closeLabel, onDismiss }: ToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-5">
      <motion.div
        role={tone === "error" ? "alert" : "status"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border bg-[var(--surface)] py-2 pl-4 pr-2 text-sm leading-5 shadow-lg ${tone === "error" ? "border-[#cb7563] text-[#ad4c36] dark:text-[#f2a18a]" : "border-[var(--line)] text-[var(--ink)]"}`}
      >
        <span className="min-w-0 flex-1">{message}</span>
        <button
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label={closeLabel}
          onClick={onDismiss}
        >
          <X size={18} />
        </button>
      </motion.div>
    </div>
  );
}
