"use client";

import type { AppCopy } from "../../../lib/mevid/copy";
import type { Plan } from "../../../lib/mevid/plan";

/** Pro reads as the accented/premium chip; free stays neutral so it doesn't compete. */
export function PlanBadge({ copy, plan, className = "" }: { copy: AppCopy; plan: Plan; className?: string }) {
  const pro = plan === "pro";
  const tone = pro
    ? "bg-[#7657dd] text-white"
    : "bg-[#efedf4] dark:bg-[#2a2636] text-[#6d6b79] dark:text-[#a79fb5]";
  return (
    <span className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold ${tone} ${className}`}>
      {pro ? copy.plans.pro : copy.plans.free}
    </span>
  );
}
