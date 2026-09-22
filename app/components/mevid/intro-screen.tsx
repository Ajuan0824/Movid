"use client";
import { ArrowRight, ArrowUpRight, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import type { ChangeEvent, RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { HeroCarousel } from "./hero-carousel";
import { Screen } from "../ui/screen";
type IntroScreenProps = {
  copy: AppCopy;
  recordInputRef: RefObject<HTMLInputElement | null>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  onRecord: () => void;
  onUpload: () => void;
  onRecordFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
export function IntroScreen({
  copy,
  recordInputRef,
  uploadInputRef,
  onRecord,
  onUpload,
  onRecordFileChange,
  onUploadFileChange,
}: IntroScreenProps) {
  return (
    <Screen>
      <div className="shrink-0">
        <p className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-[#79994e]" />
          {copy.studio.tagline}
        </p>
        <h1 className="font-display hero-title">
          {copy.hero.title}
          <span className="font-editorial block">{copy.hero.titleAccent}</span>
        </h1>
      </div>
      <motion.div
        className="hero-art"
        initial={{ opacity: 0, rotate: -4, y: 20 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.1 }}
      >
        <div className="hero-photo-back" />
        <button
          className="hero-photo w-full"
          onClick={onRecord}
          aria-label={copy.hero.record}
        >
          <HeroCarousel />
          <span className="hero-caption">
            <span>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-[.15em] text-white/75">
                {copy.studio.fromVideo}
              </span>
              <span className="font-editorial text-3xl">
                {copy.studio.toMemories}
              </span>
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#25352d]">
              <ArrowUpRight size={22} />
            </span>
          </span>
        </button>
      </motion.div>
      <div className="hero-actions">
        <div className="animated-edge record-button-shell">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onRecord}
            className="primary-button record-button"
          >
            <span className="flex items-center gap-3">
              <Camera size={23} />
              {copy.hero.record}
            </span>
            <ArrowRight size={22} />
          </motion.button>
        </div>
        <button onClick={onUpload} className="secondary-button">
          <Upload size={17} />
          {copy.hero.upload}
        </button>
      </div>
      <input
        ref={recordInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onRecordFileChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onUploadFileChange}
      />
    </Screen>
  );
}
