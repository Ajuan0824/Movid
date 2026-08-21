import { ArrowRight, Camera, Sparkles, Upload } from "lucide-react";
import { motion } from "framer-motion";
import type { ChangeEvent, RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";

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
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-9">
      <motion.div className="mb-8 text-center" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e5ddff] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#7657dd] shadow-[0_5px_18px_rgba(101,74,180,.08)]"><Sparkles size={13} />{copy.hero.eyebrow}</motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold leading-[0.98] tracking-[-0.065em] text-[#232331] sm:text-6xl">
          {copy.hero.title}<span className="block text-gradient">{copy.hero.titleAccent}</span>
        </motion.h1>
        <motion.p variants={heroTextItemVariants} className="mx-auto mt-5 max-w-md text-[15px] leading-6 text-[#6d6b79] sm:text-base">{copy.hero.description}</motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...screenTransition, delay: 0.26 }}
        className="glass-panel relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[34px] p-3 shadow-panel"
      >
        <div className="relative flex aspect-[1.56/1] items-center justify-center overflow-hidden rounded-[25px] bg-[#252334] sm:aspect-[1.72/1]">
          <div className="camera-wash" />
          <div className="absolute left-[16%] top-[16%] h-28 w-28 rounded-full bg-[#ff637a]/30 blur-2xl" />
          <div className="absolute bottom-[10%] right-[16%] h-36 w-36 rounded-full bg-[#9466ff]/35 blur-3xl" />
          <div className="relative grid h-24 w-24 place-items-center rounded-[32px] border border-white/20 bg-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,.25)] backdrop-blur-md"><Camera size={34} strokeWidth={1.5} /></div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-6 pb-5 pt-12 text-white/80">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-[#ff5d78]" />{copy.hero.maxLength}</div><span className="font-mono text-xs">00:00.0</span>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...screenTransition, delay: 0.38 }}
        className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <motion.button whileTap={{ scale: tapScale }} onClick={onRecord} className="primary-button group min-w-[202px]"><span className="record-dot" />{copy.hero.record}<ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></motion.button>
        <motion.button whileTap={{ scale: tapScale }} onClick={onUpload} className="secondary-button min-w-[202px]"><Upload size={16} />{copy.hero.upload}</motion.button>
        {/* `capture` makes iOS/Android open the native camera app directly instead of the file/photo picker. */}
        <input ref={recordInputRef} type="file" accept="video/*" capture="user" className="hidden" onChange={onRecordFileChange} />
        <input ref={uploadInputRef} type="file" accept="video/*" className="hidden" onChange={onUploadFileChange} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...screenTransition, delay: 0.46 }}
        className="mt-5 text-center text-xs font-medium text-[#9996a4]"
      >
        {copy.hero.private}
      </motion.p>
    </motion.section>
  );
}
