"use client";

import { motion } from "framer-motion";
import { RotateCcw, Star } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";

type StarMeterProps = {
  copy: AppCopy;
  left: number;
  total: number;
};

/**
 * One star glyph plus a fill bar — NOT one icon per star.
 *
 * The old version rendered `total` icons in a row, which was fine at 3 but blew
 * past the viewport at Pro's 15 and gave the whole account screen a horizontal
 * scrollbar. A bar reads the same at any allowance and can't overflow.
 */
export function StarMeter({ copy, left, total }: StarMeterProps) {
  const empty = left <= 0;
  const safeTotal = Math.max(1, total);
  const pct = Math.max(0, Math.min(100, (left / safeTotal) * 100));
  const label = empty
    ? copy.stars.spent
    : copy.stars.remaining
        .replace("{left}", String(left))
        .replace("{total}", String(total));

  return (
    <div className="flex flex-col gap-3" role="img" aria-label={label}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <Star
            size={18}
            className={
              empty ? "text-[#b65742]" : "fill-[#8c9d57] text-[#8c9d57]"
            }
          />
          <span className="font-display text-2xl font-semibold">
            {left}
            <span className="ml-1 text-sm font-normal text-muted">
              / {total}
            </span>
          </span>
        </div>
        <span className="max-w-[175px] text-right text-xs leading-4 text-muted">
          {label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-[#91aa59]"
        />
      </div>
    </div>
  );
}

/**
 * Compact star readout for the home-screen header, sitting just left of the
 * settings gear: "3/7 · 4 used". Tapping it takes free users to Pro and Pro
 * users to their account.
 */
export function HeaderStars({
  copy,
  left,
  total,
  onClick,
}: {
  copy: AppCopy;
  left: number;
  total: number;
  onClick: () => void;
}) {
  const used = Math.max(0, total - left);
  const empty = left <= 0;
  const label = copy.stars.headerSummary
    .replace("{left}", String(left))
    .replace("{total}", String(total))
    .replace("{used}", String(used));
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-[11px] font-bold leading-none text-[var(--ink)]"
    >
      <Star
        size={13}
        strokeWidth={2.4}
        className={
          empty
            ? "fill-[#b65742] text-[#b65742]"
            : "fill-[#8c9d57] text-[#8c9d57]"
        }
      />
      <span className="whitespace-nowrap">
        {left}
        <span className="font-normal opacity-60"> / {total}</span>
      </span>
    </button>
  );
}

/** Shown when the plan doc couldn't be read — the count is unknown, not zero. */
export function StarMeterError({
  copy,
  onRetry,
}: {
  copy: AppCopy;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Star
          size={20}
          strokeWidth={2}
          className="shrink-0 fill-transparent text-[#cfc8df] dark:text-[#4a4458]"
        />
        <span className="font-mono text-sm text-[#697061] dark:text-[#a0aa99]">
          — / —
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#e6e9dc] dark:bg-white/10" />
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-left text-sm font-semibold text-[#697061] transition hover:text-[#697061] dark:text-[#a0aa99] dark:hover:text-[#a6b0a3]"
      >
        {copy.stars.loadError}
        <span className="inline-flex items-center gap-1 text-[#466447] dark:text-[#d4ed8a]">
          <RotateCcw size={12} />
          {copy.stars.retry}
        </span>
      </button>
    </div>
  );
}

/** Skeleton shown while the plan doc loads, so the layout doesn't jump. */
export function StarMeterPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-2.5">
        <Star
          size={20}
          strokeWidth={2}
          className="shrink-0 fill-transparent text-[#cfc8df] dark:text-[#4a4458]"
        />
        <div className="h-5 w-16 rounded-full bg-[#dedfd5] dark:bg-white/10" />
      </div>
      <div className="h-2 rounded-full bg-[#e6e9dc] dark:bg-white/10" />
      <div className="h-3.5 w-48 rounded-full bg-[#dedfd5] dark:bg-white/10" />
    </motion.div>
  );
}
