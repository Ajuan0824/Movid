import { CheckCircle2, Circle, Download, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, resultsItemVariants, resultsListVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";
import type { VideoHighlight } from "../../../lib/mevid/types";
import { formatSeconds } from "../../../lib/mevid/video";

type ResultsScreenProps = {
  copy: AppCopy;
  videoUrl: string;
  duration: number;
  highlights: VideoHighlight[];
  selected: number;
  checked: Set<number>;
  videoRef: RefObject<HTMLVideoElement | null>;
  onNewVideo: () => void;
  onSelect: (highlight: VideoHighlight, index: number) => void;
  onToggleCheck: (index: number) => void;
  onDownloadOne: (highlight: VideoHighlight) => void;
  onDownloadChecked: () => void;
};

export function ResultsScreen({ copy, videoUrl, duration, highlights, selected, checked, videoRef, onNewVideo, onSelect, onToggleCheck, onDownloadOne, onDownloadChecked }: ResultsScreenProps) {
  const activeHighlight = highlights[selected];
  if (!activeHighlight) return null;
  const checkedCount = checked.size;

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={screenTransition} className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-8">
      <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><motion.div variants={heroTextVariants} initial="hidden" animate="visible"><motion.div variants={heroTextItemVariants} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd]"><Sparkles size={13} />{copy.results.eyebrow}</motion.div><motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.results.title}</motion.h1></motion.div><motion.button whileTap={{ scale: tapScale }} onClick={onNewVideo} className="secondary-button shrink-0"><RotateCcw size={16} />{copy.results.newVideo}</motion.button></div>
      <div className="flex flex-col gap-5">
        <div className="glass-panel overflow-hidden rounded-[32px] p-3 shadow-panel">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[23px] bg-[#17151f]"><video ref={videoRef} src={videoUrl} className="h-full w-full object-contain" controls playsInline /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" /><div className="pointer-events-none absolute bottom-4 left-4 text-white"><p className="text-[10px] font-bold tracking-[0.18em] text-white/65">{copy.results.moment} {String(selected + 1).padStart(2, "0")}</p><p className="font-display text-xl font-bold tracking-[-0.04em]">{activeHighlight.title}</p></div><div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/15 px-3 py-1.5 font-mono text-xs font-bold text-white backdrop-blur-md">{formatSeconds(activeHighlight.start)} — {formatSeconds(activeHighlight.end)}</div></div>
          <div className="px-2 pb-1 pt-5"><div className="relative h-2 rounded-full bg-[#e9e6ee]">{highlights.map((highlight, index) => <button key={`${highlight.title}-${index}`} aria-label={`${copy.results.moment} ${index + 1}: ${highlight.title}`} onClick={() => onSelect(highlight, index)} className={`absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white font-mono text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(62,50,104,.25)] transition ${selected === index ? "z-10 bg-[#ff627f]" : "bg-[#8d70ec] hover:bg-[#7657dd]"}`} style={{ left: `${(highlight.start / duration) * 100}%` }}>{index + 1}</button>)}</div><div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-[#9b98a5]"><span>0.0s</span><span>{formatSeconds(duration)}</span></div></div>
        </div>
        <aside className="glass-panel rounded-[32px] p-3 shadow-panel">
          <div className="rounded-[23px] bg-white/70 p-5">
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold">{copy.results.moments}</p><span className="font-mono text-[10px] font-bold text-[#9c98a8]">{copy.results.topFive}</span></div>
            <motion.div className="grid grid-cols-2 gap-3" variants={resultsListVariants} initial="hidden" animate="visible">
              {highlights.map((highlight, index) => {
                const isChecked = checked.has(index);
                const isActive = selected === index;
                return (
                  <motion.div key={`${highlight.title}-${index}`} variants={resultsItemVariants} className={`overflow-hidden rounded-2xl border bg-white transition ${isActive ? "border-[#7657dd] shadow-[0_10px_26px_rgba(118,87,221,.2)]" : "border-white/92"}`}>
                    <button type="button" onClick={() => onSelect(highlight, index)} className="relative block aspect-[4/3] w-full" style={{ backgroundImage: `linear-gradient(135deg, rgba(53,36,85,.18), rgba(255,94,125,.12)), url(${highlight.image})`, backgroundPosition: "center", backgroundSize: "cover" }}>
                      <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/45 font-mono text-[10px] font-bold text-white">{index + 1}</span>
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">{formatSeconds(highlight.start)}</span>
                      <motion.span
                        role="button"
                        tabIndex={0}
                        whileTap={{ scale: tapScale }}
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
                        className={`absolute right-1.5 top-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full border-2 border-white shadow-sm transition ${isChecked ? "bg-[#ff627f] text-white" : "bg-black/30 text-white/85"}`}
                      >
                        {isChecked ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </motion.span>
                    </button>
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#242432]">{highlight.title}</p>
                      <motion.button whileTap={{ scale: tapScale }} aria-label={`${copy.results.downloadOne} — ${highlight.title}`} onClick={() => onDownloadOne(highlight)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f0ecff] text-[#7657dd] transition hover:bg-[#e4dbff]"><Download size={12} /></motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          <p className="px-2 pt-3 text-xs leading-4 text-[#8f8b99]">{copy.results.selectHint}</p>
        </aside>
      </div>
      <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-[22px] border border-white bg-white/60 px-5 py-3.5 text-sm shadow-sm sm:flex-row"><p className="text-[#74717e]"><span className="font-semibold text-[#4a4753]">{copy.results.tipStart}</span> {copy.results.tipEnd}</p><motion.button whileTap={{ scale: tapScale }} disabled={checkedCount === 0} onClick={onDownloadChecked} className="primary-button !px-5 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />{checkedCount === 0 ? copy.results.downloadEmpty : `${copy.results.download} (${checkedCount})`}</motion.button></div>
    </motion.section>
  );
}
