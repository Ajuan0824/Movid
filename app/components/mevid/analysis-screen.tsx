"use client";
import { Check, ScanLine } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { VideoHighlight } from "../../../lib/mevid/types";
import { PageHeading, Screen } from "../ui/screen";
/** Reveal real results briefly; never add a multi-second artificial wait. */
export function captureSequenceMs(count: number) {
  return count > 0 ? 900 + count * 80 : 0;
}
export function AnalysisScreen({
  copy,
  step,
  videoUrl,
  duration,
  trimStart = 0,
  found = null,
}: {
  copy: AppCopy;
  step: number;
  videoUrl: string | null;
  duration: number;
  trimStart?: number;
  found?: VideoHighlight[] | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const restart = () => {
      node.currentTime = trimStart;
      void node.play().catch(() => {});
    };
    const time = () => {
      if (node.currentTime >= trimStart + duration - 0.05) restart();
    };
    if (node.readyState >= 1) restart();
    else node.addEventListener("loadedmetadata", restart);
    node.addEventListener("timeupdate", time);
    node.addEventListener("ended", restart);
    return () => {
      node.removeEventListener("loadedmetadata", restart);
      node.removeEventListener("timeupdate", time);
      node.removeEventListener("ended", restart);
    };
  }, [videoUrl, duration, trimStart]);
  return (
    <Screen>
      <PageHeading
        eyebrow={copy.analysis.eyebrow}
        title={copy.analysis.title}
      />
      <div className="photo-stage">
        {videoUrl && (
          <video
            ref={video}
            src={videoUrl}
            muted
            playsInline
            className="!object-cover opacity-70"
          />
        )}
        {!found && <div className="scan-sweep" />}
        <div className="absolute inset-7 rounded-xl border border-white/30" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-black/15 text-[#d4ed8a] backdrop-blur-md">
            {found ? (
              <Check size={30} />
            ) : (
              <ScanLine size={30} strokeWidth={1} />
            )}
          </span>
        </div>
        {found && (
          <div className="absolute inset-x-4 bottom-5 flex justify-center gap-2">
            {found.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: index % 2 ? 4 : -4 }}
                transition={{ delay: index * 0.08 }}
                className="h-16 min-w-0 flex-1 overflow-hidden rounded-lg border-2 border-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <div
        className="shrink-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
        role="status"
        aria-live="polite"
      >
        <div className="mb-3 flex gap-1">
          {copy.analysis.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${found || i === step ? "bg-[var(--violet)]" : "bg-[var(--line)]"}`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={found ? "done" : step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold"
          >
            {found
              ? copy.studio.ready
              : copy.analysis.steps[step % copy.analysis.steps.length]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs leading-5 text-muted">
          {copy.studio.analysingHint}
        </p>
      </div>
    </Screen>
  );
}
