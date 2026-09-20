"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** Native dialog gives us focus trapping, background inertness and Escape. */
export function Sheet({
  title,
  closeLabel,
  onClose,
  children,
  className = "",
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`studio-dialog ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="sheet-content"
      >
        <div className="sheet-handle" aria-hidden />
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-2xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            autoFocus
            className="icon-button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </motion.div>
    </dialog>,
    document.body,
  );
}
