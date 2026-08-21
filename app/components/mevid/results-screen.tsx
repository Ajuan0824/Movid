import { CheckCircle2, ChevronRight, Circle, Download, Play, RotateCcw, Sparkles } from "lucide-react";
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
  onDownloadChecked: () => void;
};

export function ResultsScreen({ copy, videoUrl, duration, highlights, selected, checked, videoRef, onNewVideo, onSelect, onToggleCheck, onDownloadChecked }: ResultsScreenProps) {
  const activeHighlight = highlights[selected];
  if (!activeHighlight) return null;
  const checkedCount = checked.size;

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={screenTransition} className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-8">
      <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><motion.div variants={heroTextVariants} initial="hidden" animate="visible"><motion.div variants={heroTextItemVariants} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd]"><Sparkles size={13} />{copy.results.eyebrow}</motion.div><motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.results.title}</motion.h1></motion.div><motion.button whileTap={{ scale: tapScale }} onClick={onNewVideo} className="secondary-button shrink-0"><RotateCcw size={16} />{copy.results.newVideo}</motion.button></div>
      <div className="flex flex-col gap-5">
        <div className="glass-panel overflow-hidden rounded-[32px] p-3 shadow-panel">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[23px] bg-[#17151f]"><video ref={videoRef} src={videoUrl} className="h-full w-full object-contain" controls playsInline /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" /><div className="pointer-events-none absolute bottom-4 left-4 text-white"><p className="text-[10px] font-bold tracking-[0.18em] text-white/65">{copy.results.moment} {String(selected + 1).padStart(2, "0")}</p><p className="font-display text-xl font-bold tracking-[-0.04em]">{activeHighlight.title}</p></div><div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/15 px-3 py-1.5 font-mono text-xs font-bold text-white backdrop-blur-md">{formatSeconds(activeHighlight.start)} — {formatSeconds(activeHighlight.end)}</div></div>
          <div className="px-2 pb-1 pt-4"><div className="relative h-2 rounded-full bg-[#e9e6ee]">{highlights.map((highlight, index) => <button key={`${highlight.title}-${index}`} aria-label={`${copy.results.moment} ${index + 1}: ${highlight.title}`} onClick={() => onSelect(highlight, index)} className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-full border-2 border-white transition ${selected === index ? "z-10 bg-[#ff627f] shadow-[0_2px_8px_rgba(255,77,115,.4)]" : "bg-[#8d70ec] hover:bg-[#7657dd]"}`} style={{ left: `${(highlight.start / duration) * 100}%`, width: `${Math.max(((highlight.end - highlight.start) / duration) * 100, 3)}%` }} />)}</div><div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-[#9b98a5]"><span>0.0s</span><span>{formatSeconds(duration)}</span></div></div>
        </div>
        <aside className="glass-panel rounded-[32px] p-3 shadow-panel">
          <div className="rounded-[23px] bg-white/70 p-5">
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold">{copy.results.moments}</p><span className="font-mono text-[10px] font-bold text-[#9c98a8]">{copy.results.topFive}</span></div>
            <motion.div className="space-y-2" variants={resultsListVariants} initial="hidden" animate="visible">
              {highlights.map((highlight, index) => {
                const isChecked = checked.has(index);
                return (
                  <motion.div key={`${highlight.title}-${index}`} variants={resultsItemVariants} className={`group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition ${selected === index ? "bg-[#f0ecff] ring-1 ring-[#dfd4ff]" : "hover:bg-[#f6f5f8]"}`}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: tapScale }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleCheck(index);
                      }}
                      aria-label={`${isChecked ? copy.results.downloadEmpty : copy.results.download} — ${highlight.title}`}
                      aria-pressed={isChecked}
                      className={`shrink-0 rounded-full transition ${isChecked ? "text-[#7657dd]" : "text-[#c9c5d3] hover:text-[#a49cc9]"}`}
                    >
                      {isChecked ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </motion.button>
                    <button type="button" onClick={() => onSelect(highlight, index)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <div className="relative h-[52px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-[#34313e]" style={{ backgroundImage: `linear-gradient(135deg, rgba(53,36,85,.2), rgba(255,94,125,.12)), url(${highlight.image})`, backgroundPosition: "center", backgroundSize: "cover" }}><span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">{formatSeconds(highlight.start)}</span>{selected === index && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[#7657dd]"><Play size={10} fill="currentColor" /></span>}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{highlight.title}</p></div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          <p className="px-2 pt-3 text-xs leading-4 text-[#8f8b99]">{copy.results.selectHint}</p>
        </aside>
      </div>
      <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-[22px] border border-white bg-white/60 px-5 py-3.5 text-sm shadow-sm sm:flex-row"><p className="text-[#74717e]"><span className="font-semibold text-[#4a4753]">{copy.results.tipStart}</span> {copy.results.tipEnd}</p><motion.button whileTap={{ scale: tapScale }} disabled={checkedCount === 0} onClick={onDownloadChecked} className="inline-flex items-center gap-2 font-semibold text-[#7657dd] transition hover:text-[#5c3fc4] disabled:cursor-not-allowed disabled:text-[#c4c0cf]"><Download size={16} />{checkedCount === 0 ? copy.results.downloadEmpty : `${copy.results.download} (${checkedCount})`}<ChevronRight size={15} /></motion.button></div>
    </motion.section>
  );
}
