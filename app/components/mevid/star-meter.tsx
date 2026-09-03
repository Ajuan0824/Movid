"use client";

import { motion } from "framer-motion";
import { RotateCcw, Star } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";

type StarMeterProps = {
  copy: AppCopy;
  left: number;
  total: number;
};

export function StarMeter({ copy, left, total }: StarMeterProps) {
  const empty = left <= 0;
  const label = empty
    ? copy.stars.spent
    : copy.stars.remaining.replace("{left}", String(left)).replace("{total}", String(total));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5" role="img" aria-label={label}>
        {Array.from({ length: total }, (_, index) => {
          const filled = index < left;
          return (
            <Star
              key={index}
              size={21}
              strokeWidth={2}
              className={filled ? "fill-[#ffb020] text-[#ffb020]" : "fill-transparent text-[#cfc8df] dark:text-[#4a4458]"}
            />
          );
        })}
      </div>
      <p className={`text-sm font-semibold ${empty ? "text-[#e0507a] dark:text-[#ff8fae]" : "text-[#9996a4] dark:text-[#8b8697]"}`}>
        {label}
      </p>
    </div>
  );
}

/** Shown when the plan doc couldn't be read — the count is unknown, not zero. */
export function StarMeterError({ copy, onRetry }: { copy: AppCopy; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: 3 }, (_, index) => (
          <Star key={index} size={21} strokeWidth={2} className="fill-transparent text-[#cfc8df] dark:text-[#4a4458]" />
        ))}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#9996a4] transition hover:text-[#6d6b79] dark:text-[#8b8697] dark:hover:text-[#a79fb5]"
      >
        {copy.stars.loadError}
        <span className="inline-flex items-center gap-1 text-[#7657dd] dark:text-[#b9a6ff]">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 3 }, (_, index) => (
          <Star key={index} size={21} strokeWidth={2} className="fill-transparent text-[#cfc8df] dark:text-[#4a4458]" />
        ))}
      </div>
      <div className="h-3.5 w-40 rounded-full bg-[#e7e3ee] dark:bg-white/10" />
    </motion.div>
  );
}
