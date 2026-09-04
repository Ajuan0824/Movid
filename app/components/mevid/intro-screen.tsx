import { ArrowRight, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import type { ChangeEvent, RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { HeroCarousel } from "./hero-carousel";

type IntroScreenProps = {
  copy: AppCopy;
  recordInputRef: RefObject<HTMLInputElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  onRecord: () => void;
  onUpload: () => void;
  onRecordFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function IntroScreen({ copy, recordInputRef, uploadInputRef, onRecord, onUpload, onRecordFileChange, onUploadFileChange }: IntroScreenProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-2">
      <motion.div className="mb-5 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.h1 variants={heroTextItemVariants} className="font-display text-[36px] font-bold leading-[1.02] tracking-[-0.065em] text-[#232331] dark:text-[#f1eff7] sm:text-6xl">
          {copy.hero.title}<span className="block text-gradient">{copy.hero.titleAccent}</span>
        </motion.h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...screenTransition, delay: 0.26 }}
        className="glass-panel relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] p-2.5 shadow-panel"
      >
        {/* The whole viewfinder is the record button now — tapping it opens the camera. */}
        <motion.button
          type="button"
          whileTap={{ scale: tapScale }}
          onClick={onRecord}
          aria-label={copy.hero.record}
          className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#252334] sm:aspect-[16/10]"
        >
          <HeroCarousel />
          <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-[18px] w-[18px] rounded-tl-md border-l-2 border-t-2 border-white/60" />
          <div className="pointer-events-none absolute right-3.5 top-3.5 z-10 h-[18px] w-[18px] rounded-tr-md border-r-2 border-t-2 border-white/60" />
          <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-10 h-[18px] w-[18px] rounded-bl-md border-b-2 border-l-2 border-white/60" />
          <div className="pointer-events-none absolute bottom-3.5 right-3.5 z-10 h-[18px] w-[18px] rounded-br-md border-b-2 border-r-2 border-white/60" />
          <div className="relative z-10 grid h-[76px] w-[76px] place-items-center rounded-[28px] border border-white/25 bg-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,.3)] backdrop-blur-md transition-transform duration-200 group-hover:scale-105 group-active:scale-95"><Camera size={34} strokeWidth={1.5} /></div>
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-5 pb-3.5 pt-10 text-white/85">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#ff5d78]" />{copy.hero.maxLength}</div><span className="font-mono text-sm">00:00.0</span>
          </div>
        </motion.button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.38 }}
        className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <motion.button whileTap={{ scale: tapScale }} onClick={onRecord} className="primary-button group min-w-[236px]"><span className="record-dot" />{copy.hero.record}<ArrowRight size={19} className="transition-transform group-hover:translate-x-0.5" /></motion.button>
        <motion.button whileTap={{ scale: tapScale }} onClick={onUpload} className="secondary-button min-w-[236px]"><Upload size={18} />{copy.hero.upload}</motion.button>
        {/* `capture` makes iOS/Android open the native camera app directly instead of the file/photo picker. `environment` picks the rear lens. */}
        <input ref={recordInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onRecordFileChange} />
        <input ref={uploadInputRef} type="file" accept="video/*" className="hidden" onChange={onUploadFileChange} />
      </motion.div>
    </motion.section>
  );
}
