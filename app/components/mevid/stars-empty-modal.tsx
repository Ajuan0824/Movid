"use client";
import { Sparkles, Star } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { Locale } from "../../../lib/mevid/types";
import {
  nextPeriodStart,
  PLAN_LIMITS,
  type Plan,
} from "../../../lib/mevid/plan";
import { Sheet } from "../ui/sheet";
export function StarsEmptyModal({
  copy,
  locale,
  plan,
  total,
  onClose,
  onGoPro,
}: {
  copy: AppCopy;
  locale: Locale;
  plan: Plan;
  total: number;
  onClose: () => void;
  onGoPro: () => void;
}) {
  const t = copy.stars,
    pro = plan === "pro";
  const refillDate = nextPeriodStart().toLocaleDateString(
    locale === "es" ? "es-ES" : "en-GB",
    { weekday: "long", day: "numeric", month: "long" },
  );
  return (
    <Sheet
      title={pro ? t.emptyProTitle : t.emptyFreeTitle}
      closeLabel={copy.auth.profile.close}
      onClose={onClose}
    >
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-[#e8eddb] text-[#657b3c]">
        <Star size={30} strokeWidth={1.5} />
      </div>
      <p className="text-sm leading-6 text-muted">
        {(pro ? t.emptyProBody : t.emptyFreeBody)
          .replace("{total}", String(total))
          .replace("{pro}", String(PLAN_LIMITS.pro.stars))}
      </p>
      <p className="mt-4 rounded-xl bg-[var(--page-bg)] px-4 py-3 text-xs font-semibold">
        {t.refillsOn.replace("{date}", refillDate)}
      </p>
      <button
        className="primary-button mt-5 w-full"
        onClick={() => {
          onClose();
          if (!pro) onGoPro();
        }}
      >
        {!pro && <Sparkles size={17} />}
        {pro ? t.dismiss : t.emptyFreeCta}
      </button>
    </Sheet>
  );
}
