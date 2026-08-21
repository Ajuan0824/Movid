"use client";

import { Gem } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";

type ProScreenProps = {
  copy: AppCopy;
  onCta: () => void;
};

export function ProScreen({ copy, onCta }: ProScreenProps) {
  const t = copy.pro;
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const yearly = billing === "yearly";

  const plans: Array<{ key: "monthly" | "yearly"; title: string; sub: string; tag: string; highlight: boolean }> = [
    { key: "monthly", title: t.monthly, sub: t.monthlySub, tag: "", highlight: false },
    { key: "yearly", title: t.yearly, sub: t.yearlySub, tag: t.discount, highlight: true },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-9">
      <motion.div className="mb-7 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd]"><Gem size={13} />{t.eyebrow}</motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{t.title}</motion.h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="glass-panel rounded-[26px] p-5">
          <div className="text-sm font-bold text-[#85818f]">{t.freeLabel}</div>
          <div className="my-2.5 font-display text-2xl font-bold tracking-[-0.05em]">0 €</div>
          <ul className="flex flex-col gap-2">
            {t.freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-[#4f4d5a]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b3aec0]" />{feature}</li>
            ))}
          </ul>
        </div>
        <div className="relative rounded-[26px] border border-[#dfd4ff] bg-white p-5 shadow-panel">
          <div className="absolute -top-3 right-4 rounded-full bg-[#7657dd] px-2.5 py-1 font-mono text-[10px] font-bold text-white">{t.popular}</div>
          <div className="text-sm font-bold text-[#7657dd]">{t.proLabel}</div>
          <div className="my-2.5 font-display text-2xl font-bold tracking-[-0.05em]">{yearly ? "4,08 €" : "6,99 €"}<span className="font-mono text-xs font-medium text-[#9996a4]">{t.perMonth}</span></div>
          <ul className="flex flex-col gap-2">
            {t.proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm font-medium text-[#242432]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff627f]" />{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <div role="radiogroup" className="mt-5 flex flex-col gap-2.5">
        {plans.map((plan) => {
          const active = billing === plan.key;
          return (
            <button
              key={plan.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setBilling(plan.key)}
              className={`flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition ${active ? "border-[#7657dd] bg-white shadow-panel" : "border-[#e2dfe8] bg-white/70"}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#7657dd] bg-[#7657dd]" : "border-[#cfc8df]"}`} />
              <span className="flex-1">
                <span className="block text-sm font-bold text-[#242432]">{plan.title}</span>
                <span className="mt-0.5 block text-xs text-[#6d6b79]">{plan.sub}</span>
              </span>
              {plan.tag ? <span className="rounded-full bg-[#f0ecff] px-2.5 py-1 font-mono text-[10px] font-bold text-[#5c3fc4]">{plan.tag}</span> : null}
            </button>
          );
        })}
      </div>

      <motion.button whileTap={{ scale: tapScale }} onClick={onCta} className="primary-button mt-5 w-full">{yearly ? t.ctaYearly : t.ctaMonthly}</motion.button>
      <p className="mt-3 text-center text-xs font-medium text-[#9996a4]">{t.trial}</p>
    </motion.section>
  );
}
