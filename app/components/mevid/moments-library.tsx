"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { heroTextItemVariants, heroTextVariants, iosSpring, resultsItemVariants, resultsListVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { RETENTION_DAYS } from "../../../lib/firebase/generations";
import type { StoredGeneration } from "../../../lib/mevid/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function relativeDay(copy: AppCopy, createdAt: Date) {
  const days = Math.round((startOfDay(new Date()) - startOfDay(createdAt)) / DAY_MS);
  if (days <= 0) return copy.library.today;
  if (days === 1) return copy.library.yesterday;
  return copy.library.daysAgo.replace("{days}", String(days));
}

function expiryLabel(copy: AppCopy, createdAt: Date) {
  const left = RETENTION_DAYS - Math.floor((Date.now() - createdAt.getTime()) / DAY_MS);
  if (left <= 0) return copy.library.expiresToday;
  return copy.library.expiresIn.replace("{days}", String(left));
}

type MomentsLibraryProps = {
  copy: AppCopy;
  generations: StoredGeneration[];
  onOpen: (generation: StoredGeneration) => void;
  onDelete: (generation: StoredGeneration) => void;
  onGoHome: () => void;
};

export function MomentsLibrary({ copy, generations, onOpen, onDelete, onGoHome }: MomentsLibraryProps) {
  const [confirming, setConfirming] = useState<StoredGeneration | null>(null);

  if (generations.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={screenTransition}
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-16 text-center"
      >
        <motion.div variants={heroTextVariants} initial="hidden" animate="visible">
          <motion.div variants={heroTextItemVariants} className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] dark:bg-[#2c2740] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:text-[#c4b3ff]">
            <Sparkles size={13} />{copy.results.eyebrow}
          </motion.div>
          <motion.h1 variants={heroTextItemVariants} className="font-display text-3xl font-bold tracking-[-0.06em]">{copy.momentsEmpty.title}</motion.h1>
          <motion.p variants={heroTextItemVariants} className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#6d6b79] dark:text-[#a79fb5]">{copy.momentsEmpty.description}</motion.p>
        </motion.div>
        <motion.button whileTap={{ scale: tapScale }} onClick={onGoHome} className="primary-button mt-6">{copy.momentsEmpty.cta}</motion.button>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={screenTransition}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col py-6"
    >
      <motion.div className="mb-5" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] dark:bg-[#2c2740] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:text-[#c4b3ff]">
          <Clapperboard size={13} />{copy.library.eyebrow}
        </motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">{copy.library.title}</motion.h1>
        <motion.p variants={heroTextItemVariants} className="mt-2 text-sm leading-6 text-[#6d6b79] dark:text-[#a79fb5]">{copy.library.description}</motion.p>
      </motion.div>

      <motion.ul className="grid grid-cols-2 gap-3" variants={resultsListVariants} initial="hidden" animate="visible">
        {generations.map((generation) => {
          const cover = generation.highlights[0]?.image;
          return (
            <motion.li key={generation.id} variants={resultsItemVariants} className="overflow-hidden rounded-[22px] border border-white/92 dark:border-white/10 bg-white dark:bg-[#211e2c] shadow-panel">
              <button
                type="button"
                onClick={() => {
                  tapHaptic();
                  onOpen(generation);
                }}
                aria-label={`${copy.library.open} — ${relativeDay(copy, generation.createdAt)}`}
                className="relative block aspect-[4/3] w-full bg-[#17151f]"
                style={cover ? { backgroundImage: `url(${cover})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
              >
                {generation.pending ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/45">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white">
                      <Loader2 size={11} className="animate-spin" />{copy.library.saving}
                    </span>
                  </span>
                ) : null}
                <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                  {relativeDay(copy, generation.createdAt)}
                </span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#242432] dark:text-[#f2f0f8]">
                    {copy.library.momentsCount.replace("{count}", String(generation.highlights.length))}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-[#9996a4] dark:text-[#8b8697]">{expiryLabel(copy, generation.createdAt)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: tapScale }}
                  disabled={generation.pending}
                  aria-label={`${copy.library.delete} — ${relativeDay(copy, generation.createdAt)}`}
                  onClick={() => {
                    tapHaptic();
                    setConfirming(generation);
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fff3f6] dark:bg-[#2e2030] text-[#e0507a] dark:text-[#ff8fae] transition hover:bg-[#ffe4ec] disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </motion.button>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      <AnimatePresence>
        {confirming ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm"
            onClick={() => setConfirming(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={iosSpring}
              onClick={(event) => event.stopPropagation()}
              className="liquid-glass w-full max-w-xs rounded-[28px] p-6 text-center"
            >
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#fff3f6] dark:bg-[#2e2030] text-[#e0507a] dark:text-[#ff8fae]">
                <Trash2 size={20} />
              </div>
              <p className="text-sm font-semibold leading-6 text-[#232331] dark:text-[#f1eff7]">{copy.library.deleteConfirm}</p>
              <div className="mt-5 flex gap-2">
                <motion.button whileTap={{ scale: tapScale }} onClick={() => setConfirming(null)} className="secondary-button flex-1">
                  {copy.auth.profile.close}
                </motion.button>
                <motion.button
                  whileTap={{ scale: tapScale }}
                  onClick={() => {
                    tapHaptic();
                    onDelete(confirming);
                    setConfirming(null);
                  }}
                  className="primary-button flex-1 !bg-[#e0507a]"
                >
                  {copy.library.delete}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
