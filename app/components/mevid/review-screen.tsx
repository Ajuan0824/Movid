import { ArrowRight, Check, RotateCcw, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition } from "../../../lib/mevid/motion";
import { formatTime } from "../../../lib/mevid/video";

type ReviewScreenProps = {
  copy: AppCopy;
  videoUrl: string;
  duration: number;
  onRetry: () => void;
  onAnalyse: () => void;
};

export function ReviewScreen({ copy, videoUrl, duration, onRetry, onAnalyse }: ReviewScreenProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-9">
      <motion.div className="mb-6 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1.5 text-xs font-bold text-[#3e9b71]"><Check size={13} />{copy.review.eyebrow}</motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.review.title}</motion.h1>
        <motion.p variants={heroTextItemVariants} className="mt-2 text-sm text-[#767381]">{copy.review.description}</motion.p>
      </motion.div>
      <div className="glass-panel mx-auto w-full max-w-[820px] overflow-hidden rounded-[34px] p-3 shadow-panel"><div className="relative aspect-[9/16] overflow-hidden rounded-[25px] bg-[#17151f]"><video src={videoUrl} className="h-full w-full object-contain" controls playsInline /><div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 font-mono text-xs font-semibold text-white backdrop-blur-sm">{formatTime(duration)}</div></div></div>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"><button onClick={onRetry} className="secondary-button"><RotateCcw size={16} />{copy.review.retry}</button><button onClick={onAnalyse} className="primary-button px-6"><WandSparkles size={17} />{copy.review.analyse}<ArrowRight size={17} /></button></div>
    </motion.section>
  );
}
