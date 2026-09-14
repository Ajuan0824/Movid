"use client";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Download, Maximize2, Play } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { VideoHighlight } from "../../../lib/mevid/types";
import { formatSeconds } from "../../../lib/mevid/video";
import { PageHeading, Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";
type ResultsScreenProps = {
  copy: AppCopy; videoUrl: string; duration: number; trimStart?: number; highlights: VideoHighlight[];
  selected: number; checked: Set<number>; videoRef: RefObject<HTMLVideoElement | null>;
  onNewVideo: () => void; newVideoLabel?: string; onSelect: (highlight: VideoHighlight, index: number) => void;
  onToggleCheck: (index: number) => void; onDownloadOne: (highlight: VideoHighlight) => void; onDownloadChecked: () => void;
};
export function ResultsScreen({ copy, videoUrl, duration, trimStart = 0, highlights, selected, checked, videoRef, onNewVideo, newVideoLabel, onSelect, onToggleCheck, onDownloadOne, onDownloadChecked }: ResultsScreenProps) {
  const [preview, setPreview] = useState<"video" | "image" | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const active = highlights[selected];
  useEffect(() => { strip.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }, [selected]);
  useEffect(() => {
    if (preview !== "video" || !active) return;
    const node = videoRef.current;
    if (!node) return;
    const start = () => { node.currentTime = trimStart + active.start; void node.play().catch(() => {}); };
    const limit = () => { if (node.currentTime >= trimStart + duration - .03 || node.currentTime < trimStart) { node.pause(); node.currentTime = trimStart + active.start; } };
    if (node.readyState >= 1) start();
    else node.addEventListener("loadedmetadata", start, { once: true });
    node.addEventListener("timeupdate", limit);
    return () => { node.removeEventListener("loadedmetadata", start); node.removeEventListener("timeupdate", limit); };
  }, [preview, active, trimStart, duration, videoRef]);
  if (!active) return null;
  const change = (index: number) => onSelect(highlights[index], index);
  return <Screen className="results-screen">
    <div className="flex shrink-0 items-center justify-between"><button className="flex min-h-9 items-center gap-2 text-xs font-semibold" onClick={onNewVideo}><ArrowLeft size={17} />{newVideoLabel ?? copy.results.newVideo}</button><span className="eyebrow !mb-0">{String(selected + 1).padStart(2, "0")} / {String(highlights.length).padStart(2, "0")}</span></div>
    <PageHeading title={copy.studio.ready} />
    <div className="photo-stage">
      {/* Preserve the entire photo: the downloadable asset is never cropped. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={active.image} src={active.image} alt={active.title} />
      <button className="absolute inset-0" onClick={() => setPreview("image")} aria-label={active.title} />
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 font-mono text-[10px] text-white">{formatSeconds(active.start)}</span>
      <button className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white" aria-label={copy.studio.selectPhoto + " — " + active.title} aria-pressed={checked.has(selected)} onClick={() => onToggleCheck(selected)}><span className={`grid h-6 w-6 place-items-center rounded-full border ${checked.has(selected) ? "border-[#d4ed8a] bg-[#d4ed8a] text-[#25352d]" : "border-white/80"}`}>{checked.has(selected) && <Check size={15} />}</span></button>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-white"><h2 className="font-display text-xl font-medium tracking-tight">{active.title}</h2><Maximize2 size={17} className="shrink-0" /></div>
    </div>
    <div className="shrink-0">
      <div className="mb-2 flex items-center justify-between"><span className="eyebrow !mb-0">{copy.studio.allPhotos}</span><div className="flex gap-1"><button className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-20" disabled={selected === 0} aria-label={copy.studio.previous} onClick={() => change(selected - 1)}><ChevronLeft size={18} /></button><button className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-20" disabled={selected === highlights.length - 1} aria-label={copy.studio.next} onClick={() => change(selected + 1)}><ChevronRight size={18} /></button></div></div>
      <div className="filmstrip" ref={strip}>{highlights.map((item, index) => <button key={index} className="film-cell" data-active={selected === index} aria-pressed={selected === index} aria-label={copy.results.moment + " " + (index + 1) + ": " + item.title} onClick={() => change(index)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-1 left-1 rounded-md bg-black/45 px-1.5 text-[10px] text-white">{String(index + 1).padStart(2, "0")}</span>
        {checked.has(index) && <span className="absolute right-1 top-1 rounded-full bg-[#d4ed8a] p-0.5 text-[#25352d]"><Check size={12} /></span>}
      </button>)}</div>
    </div>
    <div className="grid shrink-0 grid-cols-[50px_1fr] gap-2">
      <button className="secondary-button !px-0" onClick={() => setPreview("video")} aria-label={copy.review.preview}><Play size={19} /></button>
      <button className="primary-button" onClick={() => checked.size ? onDownloadChecked() : onDownloadOne(active)}><Download size={18} />{checked.size ? copy.results.download + " (" + checked.size + ")" : copy.results.downloadOne}</button>
    </div>
    {preview && <Sheet title={active.title} closeLabel={copy.auth.profile.close} onClose={() => setPreview(null)}>
      {preview === "video" ? <video ref={videoRef} src={videoUrl} controls playsInline className="max-h-[65dvh] w-full rounded-2xl bg-black" /> :
        // eslint-disable-next-line @next/next/no-img-element
        <img src={active.image} alt={active.title} className="max-h-[65dvh] w-full rounded-2xl object-contain" />}
      <button className="primary-button mt-4 w-full" onClick={() => onDownloadOne(active)}><Download size={17} />{copy.results.downloadOne}</button>
    </Sheet>}
  </Screen>;
}
