"use client";

import { Check, Gem, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";

/**
 * Shown only when the store can't tell us the real price (web preview, dev
 * build, a failed getOfferings). On device `monthlyPrice` comes straight from
 * StoreKit via RevenueCat and always wins — never treat this as the price.
 */
const FALLBACK_MONTHLY_PRICE = "3,99 €";

type ProScreenProps = {
  copy: AppCopy;
  /** Store SDK is usable here (native iOS build). When false the CTA explains why. */
  available: boolean;
  /** A purchase / restore is running, or the plan is being activated. */
  busy: boolean;
  /** The store has a monthly package to sell. False = nothing to buy yet. */
  hasOffering: boolean;
  monthlyPrice: string | null;
  onSubscribe: () => void;
  onRestore: () => void;
};

/** Container that staggers its children in once, on mount. */
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.28 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
};

function CompareRow({ label, free, pro }: { label: string; free: string; pro: string }) {
  return (
    <motion.div variants={rowVariants} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5">
      <span className="text-sm font-medium text-[#4f4d5a] dark:text-[#d8d3e2]">{label}</span>
      <span className="w-12 text-right font-mono text-sm text-[#a29eae] line-through dark:text-[#7e7989]">{free}</span>
      <span className="w-14 text-right font-display text-lg font-bold tracking-[-0.04em] text-[#5c3fc4] dark:text-[#b9a6ff]">{pro}</span>
    </motion.div>
  );
}

export function ProScreen({ copy, available, busy, hasOffering, monthlyPrice, onSubscribe, onRestore }: ProScreenProps) {
  const t = copy.pro;
  const reduce = useReducedMotion();
  const free = PLAN_LIMITS.free;
  const pro = PLAN_LIMITS.pro;
  const price = monthlyPrice ?? FALLBACK_MONTHLY_PRICE;
  // On device the CTA is only real once RevenueCat hands us a package; without
  // one `subscribe()` can only fail, so say so instead of offering the button.
  const sellable = !available || hasOffering;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={screenTransition}
      className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-5"
    >
      <motion.div className="mb-6 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div
          variants={heroTextItemVariants}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:bg-[#2c2740] dark:text-[#c4b3ff]"
        >
          <Gem size={13} />{t.eyebrow}
        </motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.06em] sm:text-5xl">
          {t.title}
        </motion.h1>
        <motion.p variants={heroTextItemVariants} className="mx-auto mt-3 max-w-sm text-sm leading-5 text-[#767381] dark:text-[#a79fb5]">
          {t.subtitle}
        </motion.p>
      </motion.div>

      {/* Price card. The glow sits behind it so the card's own blur stays clean. */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...screenTransition, delay: 0.18 }}
        className="relative"
      >
        <motion.div
          aria-hidden
          className="absolute -inset-3 rounded-[34px] bg-[radial-gradient(circle_at_30%_20%,#a98bff55,transparent_60%),radial-gradient(circle_at_75%_80%,#ff9dbb55,transparent_60%)] blur-xl"
          animate={reduce ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.04, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative overflow-hidden rounded-[28px] border border-[#dfd4ff] bg-white p-5 shadow-panel dark:border-[#4a3f73] dark:bg-[#211e2c]">
          <div className="absolute right-0 top-0 rounded-bl-[18px] bg-gradient-to-br from-[#7657dd] to-[#ff627f] px-3 py-1.5 font-mono text-[11px] font-bold text-white">
            {t.discount}
          </div>

          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-[#7657dd] dark:text-[#c4b3ff]">
            <Sparkles size={11} />{t.launchOffer}
          </p>

          <div className="mt-2 flex items-end gap-2.5">
            <span className="font-display text-lg font-bold text-[#a29eae] line-through dark:text-[#7e7989]">{t.wasPrice}</span>
            <span className="font-display text-[44px] font-bold leading-none tracking-[-0.06em] text-[#242432] dark:text-[#f2f0f8]">{price}</span>
            <span className="pb-1.5 font-mono text-sm font-medium text-[#9996a4] dark:text-[#8b8697]">{t.perMonth}</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-[#9996a4] dark:text-[#8b8697]">{t.billedMonthly}</p>

          <div className="my-4 h-px bg-[#efecf5] dark:bg-white/10" />

          {/* Free numbers struck through, Pro numbers highlighted — the whole pitch in three rows. */}
          <div className="mb-1 grid grid-cols-[1fr_auto_auto] gap-3 pb-1 text-[10px] font-bold tracking-[0.1em] text-[#a29eae] dark:text-[#7e7989]">
            <span />
            <span className="w-12 text-right">{t.freeLabel.toUpperCase()}</span>
            <span className="w-14 text-right text-[#7657dd] dark:text-[#c4b3ff]">{t.proLabel.toUpperCase()}</span>
          </div>
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="divide-y divide-[#efecf5] dark:divide-white/5">
            <CompareRow label={t.compare.videos} free={String(free.stars)} pro={String(pro.stars)} />
            <CompareRow label={t.compare.moments} free={String(free.moments)} pro={String(pro.moments)} />
            <CompareRow label={t.compare.length} free={`${free.videoSeconds}s`} pro={`${pro.videoSeconds}s`} />
          </motion.div>
        </div>
      </motion.div>

      <motion.ul variants={listVariants} initial="hidden" animate="visible" className="mt-5 flex flex-col gap-2.5">
        {t.perks.map((perk) => (
          <motion.li key={perk} variants={rowVariants} className="flex items-start gap-2.5 text-sm text-[#4f4d5a] dark:text-[#d8d3e2]">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e9e2ff] text-[#5c3fc4] dark:bg-[#3a3157] dark:text-[#c4b3ff]">
              <Check size={11} strokeWidth={3} />
            </span>
            {perk}
          </motion.li>
        ))}
      </motion.ul>

      <motion.button
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.5 }}
        whileTap={{ scale: tapScale }}
        disabled={busy || !sellable}
        onClick={onSubscribe}
        className="primary-button mt-6 w-full disabled:opacity-60"
      >
        {busy ? t.activating : t.cta}
      </motion.button>

      <p className="mt-3 text-center text-xs font-semibold text-[#6d6b79] dark:text-[#a79fb5]">
        {!available ? t.unavailable : !hasOffering ? t.noOffering : t.trial.replace("{price}", price)}
      </p>

      {available ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onRestore}
            className="mx-auto mt-2 block text-xs font-semibold text-[#7657dd] disabled:opacity-60 dark:text-[#c4b3ff]"
          >
            {busy ? t.restoring : t.restore}
          </button>
          <p className="mt-4 text-center text-[10px] leading-4 text-[#a29eae] dark:text-[#7e7989]">{t.legal}</p>
        </>
      ) : null}
    </motion.section>
  );
}
