import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import { formatTime, MAX_VIDEO_SECONDS } from "../../../lib/mevid/video";

type RecordingScreenProps = {
  copy: AppCopy;
  elapsed: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCancel: () => void;
  onStop: () => void;
};

export function RecordingScreen({ copy, elapsed, videoRef, onCancel, onStop }: RecordingScreenProps) {
  return (
    <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={screenTransition} className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-9">
      <motion.div className="mb-6 flex items-center justify-between px-1" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.button variants={heroTextItemVariants} whileTap={{ scale: tapScale }} onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-semibold text-[#706e7d] transition hover:text-[#242432]"><X size={17} />{copy.recording.cancel}</motion.button>
        <motion.div variants={heroTextItemVariants} className="flex items-center gap-2 rounded-full bg-[#fff0f3] px-3.5 py-2 text-xs font-bold text-[#e44566]"><span className="recording-pulse" />{copy.recording.active}</motion.div>
        <motion.span variants={heroTextItemVariants} className="font-mono text-sm font-semibold text-[#494753]">{formatTime(elapsed)} / 00:15.0</motion.span>
      </motion.div>
      <div className="glass-panel mx-auto w-full max-w-[820px] overflow-hidden rounded-[34px] p-3 shadow-panel">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[25px] bg-[#16151f]">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="absolute inset-x-0 top-0 h-1 bg-white/20"><motion.div className="h-full bg-[#ff5d78]" animate={{ width: `${(elapsed / MAX_VIDEO_SECONDS) * 100}%` }} transition={{ ease: "linear", duration: 0.1 }} /></div>
          <div className="absolute inset-0 rounded-[25px] border-2 border-[#ff5d78]/70 shadow-[inset_0_0_50px_rgba(255,70,110,.18)]" />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2"><motion.button whileTap={{ scale: tapScale }} aria-label={copy.recording.stop} onClick={onStop} className="grid h-[76px] w-[76px] place-items-center rounded-full border-[5px] border-white/80 bg-black/10 backdrop-blur-sm transition hover:scale-105"><span className="h-7 w-7 rounded-[7px] bg-[#ff5d78]" /></motion.button></div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-[#7c7987]">{copy.recording.helper}</p>
    </motion.section>
  );
}
