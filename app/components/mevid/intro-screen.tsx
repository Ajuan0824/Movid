import { ArrowRight, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import type { ChangeEvent, RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { StarMeter, StarMeterError, StarMeterPlaceholder } from "./star-meter";

type IntroScreenProps = {
  copy: AppCopy;
  recordInputRef: RefObject<HTMLInputElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  onRecord: () => void;
  onUpload: () => void;
  onRecordFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  planReady: boolean;
  planError: boolean;
  onReloadPlan: () => void;
  starsLeft: number;
  starsTotal: number;
};

export function IntroScreen({ copy, recordInputRef, uploadInputRef, onRecord, onUpload, onRecordFileChange, onUploadFileChange, planReady, planError, onReloadPlan, starsLeft, starsTotal }: IntroScreenProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-2">
      <motion.div className="mb-4 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.h1 variants={heroTextItemVariants} className="font-display text-[28px] font-bold leading-[1.02] tracking-[-0.065em] text-[#232331] dark:text-[#f1eff7] sm:text-6xl">
          {copy.hero.title}<span className="block text-gradient">{copy.hero.titleAccent}</span>
        </motion.h1>
        <motion.p variants={heroTextItemVariants} className="mx-auto mt-2.5 max-w-md text-[13px] leading-5 text-[#6d6b79] dark:text-[#a79fb5] sm:text-base">{copy.hero.description}</motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...screenTransition, delay: 0.26 }}
        className="glass-panel relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[28px] p-2.5 shadow-panel"
      >
        <div className="relative flex aspect-[2.1/1] items-center justify-center overflow-hidden rounded-[20px] bg-[#252334] sm:aspect-[1.72/1]">
          <div className="camera-wash" />
          <div className="absolute left-[16%] top-[16%] h-28 w-28 rounded-full bg-[#ff637a]/30 blur-2xl" />
          <div className="absolute bottom-[10%] right-[16%] h-36 w-36 rounded-full bg-[#9466ff]/35 blur-3xl" />
          <div className="scan-sweep" />
          <div className="pointer-events-none absolute left-3.5 top-3.5 h-[18px] w-[18px] rounded-tl-md border-l-2 border-t-2 border-white/40" />
          <div className="pointer-events-none absolute right-3.5 top-3.5 h-[18px] w-[18px] rounded-tr-md border-r-2 border-t-2 border-white/40" />
          <span className="absolute left-1/2 top-2.5 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-[#cdbdff]" />{copy.hero.aiReady}</span>
          <div className="relative grid h-16 w-16 place-items-center rounded-[26px] border border-white/20 bg-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,.25)] backdrop-blur-md"><Camera size={28} strokeWidth={1.5} /></div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-5 pb-3 pt-10 text-white/80">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-[#ff5d78]" />{copy.hero.maxLength}</div><span className="font-mono text-xs">00:00.0</span>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.38 }}
        className="mt-4 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
      >
        <motion.button whileTap={{ scale: tapScale }} onClick={onRecord} className="primary-button group min-w-[202px]"><span className="record-dot" />{copy.hero.record}<ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></motion.button>
        <motion.button whileTap={{ scale: tapScale }} onClick={onUpload} className="secondary-button min-w-[202px]"><Upload size={16} />{copy.hero.upload}</motion.button>
        {/* `capture` makes iOS/Android open the native camera app directly instead of the file/photo picker. `environment` picks the rear lens. */}
        <input ref={recordInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onRecordFileChange} />
        <input ref={uploadInputRef} type="file" accept="video/*" className="hidden" onChange={onUploadFileChange} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.42 }}
        className="mt-3.5"
      >
        {!planReady ? (
          <StarMeterPlaceholder />
        ) : planError ? (
          <StarMeterError copy={copy} onRetry={onReloadPlan} />
        ) : (
          <StarMeter copy={copy} left={starsLeft} total={starsTotal} />
        )}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...screenTransition, delay: 0.46 }}
        className="mt-3 text-center text-xs font-medium text-[#9996a4] dark:text-[#8b8697]"
      >
        {copy.hero.private}
      </motion.p>
    </motion.section>
  );
}
