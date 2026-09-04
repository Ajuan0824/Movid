"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";

/**
 * Shown only when the store can't tell us the real price (web preview, dev
 * build, a failed getOfferings). On device `monthlyPrice` comes straight from
 * StoreKit via RevenueCat and always wins — never treat this as the price.
 * App Store Connect has com.mevid.app.pro.monthly at 3,99 €.
 */
const FALLBACK_MONTHLY_PRICE = "3,99 €";

type ProScreenProps = {
  copy: AppCopy;
  /** Store SDK is usable here (native iOS build). */
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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.26 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] as const } },
};

function CompareRow({ label, free, pro }: { label: string; free: string; pro: string }) {
  return (
    <motion.div variants={rowVariants} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5">
      <span className="text-[15px] font-medium text-[#4f4d5a] dark:text-[#d8d3e2]">{label}</span>
      <span className="w-12 text-right font-display text-[17px] font-semibold text-[#a29eae] dark:text-[#7e7989]">{free}</span>
      <span className="w-14 text-right font-display text-[21px] font-bold tracking-[-0.04em] text-[#5c3fc4] dark:text-[#b9a6ff]">{pro}</span>
    </motion.div>
  );
}

/**
 * Deliberately sized to fit one phone screen with no scrolling: no eyebrow
 * chip, no perk bullets, and the comparison table carries the whole pitch.
 * Keep anything added here cheap in vertical space.
 */
export function ProScreen({ copy, available, busy, hasOffering, monthlyPrice, onSubscribe, onRestore }: ProScreenProps) {
  const t = copy.pro;
  const reduce = useReducedMotion();
  const free = PLAN_LIMITS.free;
  const pro = PLAN_LIMITS.pro;
  const price = monthlyPrice ?? FALLBACK_MONTHLY_PRICE;
  // On device the CTA is only real once RevenueCat hands us a package; without
  // one `subscribe()` can only fail, so say so instead of offering the button.
  const nothingToSell = available && !hasOffering;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={screenTransition}
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-2"
    >
      <motion.div className="mb-4 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.h1 variants={heroTextItemVariants} className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.06em] sm:text-5xl">
          {t.title}
        </motion.h1>
        <motion.p variants={heroTextItemVariants} className="mx-auto mt-2.5 max-w-[20rem] text-[15px] leading-[1.35] text-[#767381] dark:text-[#a79fb5]">
          {t.subtitle}
        </motion.p>
      </motion.div>

      {/* Price card. The glow sits behind it so the card's own surface stays clean. */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...screenTransition, delay: 0.16 }}
        className="relative"
      >
        <motion.div
          aria-hidden
          className="absolute -inset-2.5 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,#a98bff55,transparent_60%),radial-gradient(circle_at_75%_80%,#ff9dbb55,transparent_60%)] blur-xl"
          animate={reduce ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.04, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative overflow-hidden rounded-[26px] border border-[#dfd4ff] bg-white p-4 shadow-panel dark:border-[#4a3f73] dark:bg-[#211e2c]">
          <div className="absolute right-0 top-0 rounded-bl-[16px] bg-gradient-to-br from-[#7657dd] to-[#ff627f] px-2.5 py-1 font-mono text-[11px] font-bold text-white">
            {t.discount}
          </div>

          <p className="text-[11px] font-bold tracking-[0.12em] text-[#7657dd] dark:text-[#c4b3ff]">{t.launchOffer}</p>

          <div className="mt-1.5 flex items-end gap-2">
            <span className="font-display text-lg font-bold text-[#a29eae] line-through dark:text-[#7e7989]">{t.wasPrice}</span>
            <span className="font-display text-[46px] font-bold leading-none tracking-[-0.06em] text-[#242432] dark:text-[#f2f0f8]">{price}</span>
            <span className="pb-1 font-mono text-sm font-medium text-[#9996a4] dark:text-[#8b8697]">{t.perMonth}</span>
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-[#9996a4] dark:text-[#8b8697]">{t.billedMonthly}</p>

          <div className="my-3 h-px bg-[#efecf5] dark:bg-white/10" />

          {/* Free numbers muted, Pro numbers big and highlighted — the whole pitch in three rows. */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-1 text-[11px] font-bold tracking-[0.1em] text-[#a29eae] dark:text-[#7e7989]">
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

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.44 }}
        whileTap={{ scale: tapScale }}
        disabled={busy || nothingToSell}
        onClick={onSubscribe}
        className="primary-button mt-4 w-full disabled:opacity-60"
      >
        {busy ? t.activating : t.cta}
      </motion.button>

      <p className="mt-3 text-center text-sm font-semibold text-[#6d6b79] dark:text-[#a79fb5]">
        {nothingToSell ? t.noOffering : t.trial.replace("{price}", price)}
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={onRestore}
        className="mx-auto mt-2 block text-sm font-semibold text-[#7657dd] disabled:opacity-60 dark:text-[#c4b3ff]"
      >
        {busy ? t.restoring : t.restore}
      </button>

      {/* Guideline 3.1.2 wants these reachable before an auto-renewing purchase. */}
      <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] font-semibold text-[#9996a4] dark:text-[#8b8697]">
        <a href="/legal/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{copy.account.terms}</a>
        <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{copy.account.privacy}</a>
      </div>
    </motion.section>
  );
}
