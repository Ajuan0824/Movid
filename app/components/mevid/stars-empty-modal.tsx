"use client";

import { motion } from "framer-motion";
import { Sparkles, Star, X } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { Locale } from "../../../lib/mevid/types";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { iosSpring, tapScale } from "../../../lib/mevid/motion";
import { nextPeriodStart, PLAN_LIMITS, type Plan } from "../../../lib/mevid/plan";

type StarsEmptyModalProps = {
  copy: AppCopy;
  locale: Locale;
  plan: Plan;
  total: number;
  onClose: () => void;
  onGoPro: () => void;
};

export function StarsEmptyModal({ copy, locale, plan, total, onClose, onGoPro }: StarsEmptyModalProps) {
  const t = copy.stars;
  const isPro = plan === "pro";
  const refillDate = nextPeriodStart().toLocaleDateString(locale === "es" ? "es-ES" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={iosSpring}
        onClick={(event) => event.stopPropagation()}
        className="liquid-glass relative w-full max-w-sm rounded-[28px] p-6 text-center"
      >
        <button
          onClick={onClose}
          aria-label={copy.auth.profile.close}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/70 dark:bg-white/5 text-[#6d6b79] dark:text-[#a79fb5] hover:bg-white dark:hover:bg-white/15"
        >
          <X size={16} />
        </button>

        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fff4e0] dark:bg-[#38301f]">
          <Star size={26} className="fill-[#ffb020] text-[#ffb020]" />
        </div>

        <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-[#232331] dark:text-[#f1eff7]">
          {isPro ? t.emptyProTitle : t.emptyFreeTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6d6b79] dark:text-[#a79fb5]">
          {(isPro ? t.emptyProBody : t.emptyFreeBody).replace("{total}", String(total)).replace("{pro}", String(PLAN_LIMITS.pro.stars))}
        </p>
        <p className="mt-3 inline-block rounded-full bg-[#f3f1fa] dark:bg-[#26222f] px-3 py-1.5 text-xs font-semibold text-[#6d6b79] dark:text-[#a79fb5]">
          {t.refillsOn.replace("{date}", refillDate)}
        </p>

        {isPro ? (
          <motion.button whileTap={{ scale: tapScale }} onClick={() => { tapHaptic(); onClose(); }} className="secondary-button mt-5 w-full">
            {t.dismiss}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: tapScale }}
            onClick={() => { tapHaptic(); onClose(); onGoPro(); }}
            className="primary-button mt-5 w-full"
          >
            <Sparkles size={16} />{t.emptyFreeCta}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
