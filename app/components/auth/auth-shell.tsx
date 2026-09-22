"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { authScreenTransition } from "../../../lib/mevid/motion";
type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  compact?: boolean;
};
export function AuthShell({
  title,
  description,
  children,
  footer,
  onBack,
  backLabel,
  compact = false,
}: AuthShellProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={authScreenTransition}
      className={`auth-shell ${compact ? "auth-compact" : ""}`}
    >
      <div className="auth-inner">
        <div className="auth-heading">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 flex min-h-11 items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </button>
          )}
          {!onBack && (
            <div aria-hidden className="mb-5 flex -space-x-2">
              {["01-selfie-friends", "04-dog-cafe", "02-street-food"].map(
                (src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={`/carousel/${src}.jpg`}
                    alt=""
                    className="h-12 w-12 rounded-full border-[3px] border-[var(--page-bg)] object-cover"
                    style={{ transform: `rotate(${i % 2 ? 8 : -8}deg)` }}
                  />
                ),
              )}
            </div>
          )}
          <h1 className="auth-title">{title}</h1>
          <p className="mt-2 max-w-[290px] text-sm leading-5 text-muted">
            {description}
          </p>
        </div>
        <div className="auth-card">{children}</div>
        {footer && (
          <div className="mt-4 text-center text-xs text-muted">{footer}</div>
        )}
      </div>
    </motion.section>
  );
}
export function AuthSubmitButton({
  loading,
  onTap,
  children,
}: {
  loading: boolean;
  onTap: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      aria-busy={loading}
      onClick={onTap}
      type="submit"
      className="primary-button mt-1 w-full"
    >
      <span className={loading ? "sr-only" : ""}>{children}</span>
      {loading && <Loader2 size={19} className="animate-spin" aria-hidden />}
    </motion.button>
  );
}
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-xl border border-[#cb75634d] bg-[#cb756310] px-3 py-2 text-sm leading-5 text-[#a4432f] dark:text-[#f2a18a]"
    >
      {message}
    </motion.p>
  );
}
