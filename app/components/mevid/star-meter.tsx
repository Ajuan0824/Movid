"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
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
      <div className="flex items-center gap-1" role="img" aria-label={label}>
        {Array.from({ length: total }, (_, index) => {
          const filled = index < left;
          return (
            <Star
              key={index}
              size={16}
              strokeWidth={2}
              className={filled ? "fill-[#ffb020] text-[#ffb020]" : "fill-transparent text-[#cfc8df] dark:text-[#4a4458]"}
            />
          );
        })}
      </div>
      <p className={`text-xs font-semibold ${empty ? "text-[#e0507a] dark:text-[#ff8fae]" : "text-[#9996a4] dark:text-[#8b8697]"}`}>
        {label}
      </p>
    </div>
  );
}

/** Skeleton shown while the plan doc loads, so the layout doesn't jump. */
export function StarMeterPlaceholder() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <Star key={index} size={16} strokeWidth={2} className="fill-transparent text-[#cfc8df] dark:text-[#4a4458]" />
        ))}
      </div>
      <div className="h-3 w-32 rounded-full bg-[#e7e3ee] dark:bg-white/10" />
    </motion.div>
  );
}
