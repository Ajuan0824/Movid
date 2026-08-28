"use client";

import { ArrowRight, Check, Play, RotateCcw, WandSparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, iosSpring, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { formatTime } from "../../../lib/mevid/video";

type ReviewScreenProps = {
  copy: AppCopy;
  videoUrl: string;
  duration: number;
  onRetry: () => void;
  onAnalyse: () => void;
};

export function ReviewScreen({ copy, videoUrl, duration, onRetry, onAnalyse }: ReviewScreenProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-2">
        <motion.div className="mb-4 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
          <motion.div variants={heroTextItemVariants} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] dark:bg-[#1f2e28] px-3 py-1.5 text-xs font-bold text-[#3e9b71]"><Check size={13} />{copy.review.eyebrow}</motion.div>
          <motion.h1 variants={heroTextItemVariants} className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.review.title}</motion.h1>
          <motion.p variants={heroTextItemVariants} className="mt-2 text-sm text-[#767381] dark:text-[#a79fb5]">{copy.review.description}</motion.p>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => setPreviewOpen(true)}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...screenTransition, delay: 0.2 }}
          whileTap={{ scale: tapScale }}
          className="glass-panel relative mx-auto block w-full max-w-[420px] overflow-hidden rounded-[28px] p-2 shadow-panel"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#17151f]">
            <video src={videoUrl} className="h-full w-full object-cover" playsInline muted />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur-sm">{formatTime(duration)}</div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#242432] dark:text-[#f2f0f8] shadow-lg"><Play size={22} fill="currentColor" /></span>
            </div>
          </div>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...screenTransition, delay: 0.32 }} className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"><motion.button whileTap={{ scale: tapScale }} onClick={onRetry} className="secondary-button"><RotateCcw size={16} />{copy.review.retry}</motion.button><motion.button whileTap={{ scale: tapScale }} onClick={onAnalyse} className="primary-button px-6"><WandSparkles size={17} />{copy.review.analyse}<ArrowRight size={17} /></motion.button></motion.div>
      </motion.section>

      <AnimatePresence>
        {previewOpen ? (
          <motion.div
            key="review-video-backdrop"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={iosSpring}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] bg-[#17151f] shadow-2xl"
            >
              <div className="relative aspect-[9/16]">
                <video src={videoUrl} className="h-full w-full object-contain" controls autoPlay playsInline />
              </div>
              <button
                type="button"
                aria-label={copy.auth.profile.close}
                onClick={() => setPreviewOpen(false)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
