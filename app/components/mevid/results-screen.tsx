"use client";

import { CheckCircle2, Circle, Download, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, iosSpring, resultsItemVariants, resultsListVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import type { VideoHighlight } from "../../../lib/mevid/types";
import { formatSeconds } from "../../../lib/mevid/video";

type PreviewMode = "video" | "image" | null;

type ResultsScreenProps = {
  copy: AppCopy;
  videoUrl: string;
  duration: number;
  /** In-point of the kept window inside the stored (untrimmed) clip. */
  trimStart?: number;
  highlights: VideoHighlight[];
  selected: number;
  checked: Set<number>;
  videoRef: RefObject<HTMLVideoElement | null>;
  onNewVideo: () => void;
  /** Defaults to "new video"; the library detail view uses it to say "back". */
  newVideoLabel?: string;
  onSelect: (highlight: VideoHighlight, index: number) => void;
  onToggleCheck: (index: number) => void;
  onDownloadOne: (highlight: VideoHighlight) => void;
  onDownloadChecked: () => void;
};

export function ResultsScreen({ copy, videoUrl, duration, trimStart = 0, highlights, selected, checked, videoRef, onNewVideo, newVideoLabel, onSelect, onToggleCheck, onDownloadOne, onDownloadChecked }: ResultsScreenProps) {
  const [preview, setPreview] = useState<PreviewMode>(null);
  const activeHighlight = highlights[selected];
  const checkedCount = checked.size;

  useEffect(() => {
    if (preview !== "video") return;
    const node = videoRef.current;
    if (!node || !activeHighlight) return;
    // Highlight times are relative to the trimmed window; the stored file isn't
    // cut, so playback is offset by the in-point and stops at the window's end.
    const windowEnd = trimStart + duration;
    node.currentTime = trimStart + activeHighlight.start;
    void node.play();
    const onTime = () => {
      if (node.currentTime >= windowEnd - 0.03) {
        node.pause();
        node.currentTime = trimStart + activeHighlight.start;
      }
    };
    node.addEventListener("timeupdate", onTime);
    return () => node.removeEventListener("timeupdate", onTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, selected, activeHighlight?.start, trimStart, duration]);

  if (!activeHighlight) return null;

  const openImagePreview = (highlight: VideoHighlight, index: number) => {
    onSelect(highlight, index);
    setPreview("image");
  };

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={screenTransition} className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-3">
        <motion.div className="mb-4" variants={heroTextVariants} initial="hidden" animate="visible">
          <motion.button
            variants={heroTextItemVariants}
            whileHover={{ y: -1 }}
            whileTap={{ scale: tapScale }}
            onClick={onNewVideo}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/60 dark:border-white/10 bg-gradient-to-r from-[#7657dd] via-[#9366e6] to-[#f0629a] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_22px_rgba(118,87,221,.34)] transition-shadow hover:shadow-[0_11px_28px_rgba(118,87,221,.46)]"
          >
            <RotateCcw size={13} strokeWidth={2.8} />{newVideoLabel ?? copy.results.newVideo}
          </motion.button>
          <motion.h1 variants={heroTextItemVariants} className="font-display text-3xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.results.title}</motion.h1>
        </motion.div>
        <div className="flex flex-col gap-5">
          <div className="glass-panel overflow-hidden rounded-[32px] p-3 shadow-panel">
            <motion.button
              type="button"
              onClick={() => setPreview("video")}
              whileTap={{ scale: tapScale }}
              className="relative block w-full overflow-hidden rounded-[23px] bg-[#17151f]"
            >
              <div
                className="relative aspect-[4/3]"
                style={{ backgroundImage: `linear-gradient(135deg, rgba(53,36,85,.18), rgba(255,94,125,.12)), url(${activeHighlight.image})`, backgroundPosition: "center", backgroundSize: "cover" }}
              >
                <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-sm">{copy.results.moment} {String(selected + 1).padStart(2, "0")}</div>
                <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">{formatSeconds(activeHighlight.start)} — {formatSeconds(activeHighlight.end)}</div>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#242432] dark:text-[#f2f0f8] shadow-lg"><Play size={22} fill="currentColor" /></span>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-10 text-left text-white">
                  <p className="font-display text-lg font-bold tracking-[-0.03em]">{activeHighlight.title}</p>
                </div>
              </div>
            </motion.button>
            <div className="px-2 pb-1 pt-5"><div className="relative h-2 rounded-full bg-[#e9e6ee]">{highlights.map((highlight, index) => <button key={`${highlight.title}-${index}`} aria-label={`${copy.results.moment} ${index + 1}: ${highlight.title}`} onClick={() => onSelect(highlight, index)} className={`absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white font-mono text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(62,50,104,.25)] transition ${selected === index ? "z-10 bg-[#ff627f]" : "bg-[#8d70ec] hover:bg-[#7657dd]"}`} style={{ left: `${(highlight.start / duration) * 100}%` }}>{index + 1}</button>)}</div><div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-[#9b98a5] dark:text-[#948fa0]"><span>0.0s</span><span>{formatSeconds(duration)}</span></div></div>
          </div>
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSpring, delay: 0.12 }}
            className="relative overflow-hidden rounded-[32px] p-3 shadow-panel"
          >
            {/* animated gradient wash behind the glass */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-32 opacity-60 dark:opacity-35"
              style={{ background: "radial-gradient(circle at 30% 30%, #b79bff 0%, transparent 55%), radial-gradient(circle at 75% 70%, #ff9ec4 0%, transparent 55%)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
            />
            <div className="glass-panel absolute inset-0 rounded-[32px]" />
            <div className="relative rounded-[23px] bg-white/75 dark:bg-white/5 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-bold">
                  <motion.span
                    animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[#7657dd] dark:text-[#c4b3ff]"
                  >
                    <Sparkles size={15} />
                  </motion.span>
                  <span className="text-gradient">{copy.results.moments}</span>
                </p>
                <motion.button
                  whileHover={{ scale: checkedCount === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: checkedCount === 0 ? 1 : tapScale }}
                  disabled={checkedCount === 0}
                  onClick={onDownloadChecked}
                  aria-label={checkedCount === 0 ? copy.results.downloadEmpty : `${copy.results.download} (${checkedCount})`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7657dd] to-[#f0629a] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(118,87,221,.34)] transition-all disabled:from-[#c9c4d4] disabled:to-[#c9c4d4] disabled:shadow-none dark:disabled:from-white/12 dark:disabled:to-white/12"
                >
                  <Download size={12} strokeWidth={2.6} />
                  <AnimatePresence mode="popLayout" initial={false}>
                    {checkedCount > 0 ? (
                      <motion.span
                        key={checkedCount}
                        initial={{ y: 8, opacity: 0, scale: 0.6 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -8, opacity: 0, scale: 0.6 }}
                        transition={iosSpring}
                      >
                        {checkedCount}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              </div>
              <motion.div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 py-2" variants={resultsListVariants} initial="hidden" animate="visible">
                {highlights.map((highlight, index) => {
                  const isChecked = checked.has(index);
                  const isActive = selected === index;
                  return (
                    <motion.div
                      key={`${highlight.title}-${index}`}
                      variants={resultsItemVariants}
                      layout
                      whileHover={{ y: -5, scale: 1.035 }}
                      whileTap={{ scale: 0.975 }}
                      transition={iosSpring}
                      className={`group relative w-28 shrink-0 snap-start overflow-hidden rounded-2xl border bg-white dark:bg-[#211e2c] ${isActive ? "border-transparent shadow-[0_14px_30px_rgba(118,87,221,.26)]" : "border-white/92 shadow-[0_6px_16px_rgba(62,50,104,.08)] dark:border-white/10"}`}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="results-active-ring"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="pointer-events-none absolute inset-0 z-20 rounded-2xl border-2 border-[#7657dd]"
                        />
                      ) : null}
                      <button type="button" onClick={() => openImagePreview(highlight, index)} className="relative block aspect-[4/3] w-full overflow-hidden">
                        <span
                          className="absolute inset-0 transition-transform duration-[650ms] ease-out group-hover:scale-[1.12]"
                          style={{ backgroundImage: `linear-gradient(135deg, rgba(53,36,85,.18), rgba(255,94,125,.12)), url(${highlight.image})`, backgroundPosition: "center", backgroundSize: "cover" }}
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/45 font-mono text-[10px] font-bold text-white backdrop-blur-sm">{index + 1}</span>
                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-sm">{formatSeconds(highlight.start)}</span>
                        <motion.span
                          role="button"
                          tabIndex={0}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={iosSpring}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleCheck(index);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onToggleCheck(index);
                            }
                          }}
                          aria-label={`${isChecked ? copy.results.downloadEmpty : copy.results.download} — ${highlight.title}`}
                          aria-pressed={isChecked}
                          className={`absolute right-1.5 top-1.5 z-10 grid h-6 w-6 cursor-pointer place-items-center rounded-full border-2 border-white shadow-sm transition-colors ${isChecked ? "bg-gradient-to-br from-[#ff627f] to-[#7657dd] text-white" : "bg-black/35 text-white/85"}`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={isChecked ? "on" : "off"}
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ type: "spring", stiffness: 500, damping: 26 }}
                            >
                              {isChecked ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            </motion.span>
                          </AnimatePresence>
                        </motion.span>
                      </button>
                      <div className="relative flex items-center gap-2 px-2.5 py-2">
                        <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#242432] dark:text-[#f2f0f8]">{highlight.title}</p>
                        <motion.button
                          whileHover={{ scale: 1.14, rotate: -6 }}
                          whileTap={{ scale: 0.86 }}
                          transition={iosSpring}
                          aria-label={`${copy.results.downloadOne} — ${highlight.title}`}
                          onClick={() => onDownloadOne(highlight)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f0ecff] to-[#ffe6f0] text-[#7657dd] shadow-sm transition-shadow hover:shadow-[0_4px_12px_rgba(118,87,221,.3)] dark:from-[#2c2740] dark:to-[#3a2740] dark:text-[#c4b3ff]"
                        >
                          <Download size={12} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative px-2 pt-3 text-xs leading-4 text-[#8f8b99] dark:text-[#a79fb5]"
            >
              {copy.results.selectHint}
            </motion.p>
          </motion.aside>
        </div>
      </motion.section>

      <AnimatePresence>
        {preview ? (
          <motion.div
            key="results-preview-backdrop"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={iosSpring}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] bg-[#17151f] shadow-2xl"
            >
              {preview === "video" ? (
                <div className="relative aspect-[9/16]">
                  <video ref={videoRef} src={videoUrl} className="h-full w-full object-contain" controls playsInline />
                  <div className="pointer-events-none absolute inset-x-0 bottom-16 flex items-center justify-between px-4 text-white"><p className="font-display text-lg font-bold tracking-[-0.03em] drop-shadow">{activeHighlight.title}</p></div>
                </div>
              ) : (
                <div
                  className="relative aspect-[9/16]"
                  style={{ backgroundImage: `url(${activeHighlight.image})`, backgroundPosition: "center", backgroundSize: "cover" }}
                >
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-16 text-white">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-white/65">{copy.results.moment} {String(selected + 1).padStart(2, "0")}</p>
                    <p className="font-display text-xl font-bold tracking-[-0.03em]">{activeHighlight.title}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                aria-label={copy.auth.profile.close}
                onClick={() => setPreview(null)}
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
