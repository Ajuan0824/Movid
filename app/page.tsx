"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnalysisScreen } from "./components/mevid/analysis-screen";
import { Brand } from "./components/mevid/brand";
import { DesktopGate } from "./components/mevid/desktop-gate";
import { DotGrid } from "./components/mevid/dot-grid";
import { IntroScreen } from "./components/mevid/intro-screen";
import { LanguageSwitcher } from "./components/mevid/language-switcher";
import { RecordingScreen } from "./components/mevid/recording-screen";
import { ResultsScreen } from "./components/mevid/results-screen";
import { ReviewScreen } from "./components/mevid/review-screen";
import { useIsMobile } from "../hooks/use-is-mobile";
import { useVideoRecorder } from "../hooks/use-video-recorder";
import { getCopy } from "../lib/mevid/copy";
import { getFallbackHighlights } from "../lib/mevid/highlights";
import type { AnalysisResponse, Locale, VideoHighlight, VisualSource } from "../lib/mevid/types";
import { extractFrames, getVideoDuration, MAX_VIDEO_SECONDS } from "../lib/mevid/video";

type View = "idle" | "review" | "analysing" | "results";

export default function Home() {
  const mobileState = useIsMobile();
  const [locale, setLocale] = useState<Locale>("en");
  const [view, setView] = useState<View>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(MAX_VIDEO_SECONDS);
  const [highlights, setHighlights] = useState<VideoHighlight[]>([]);
  const [selected, setSelected] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [visualSource, setVisualSource] = useState<VisualSource>("placeholder");
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const copy = getCopy(locale);

  const clearVideo = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setVideoUrl(null);
  }, []);

  const displayVideo = useCallback((video: Blob, duration: number) => {
    clearVideo();
    const nextUrl = URL.createObjectURL(video);
    urlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setVideoDuration(Math.min(duration, MAX_VIDEO_SECONDS));
    setView("review");
  }, [clearVideo]);

  const handleRecorderError = useCallback((recorderError: Error) => {
    setError(recorderError.message === "unsupported" ? getCopy(locale).errors.unsupported : getCopy(locale).errors.camera);
  }, [locale]);

  const recorder = useVideoRecorder({ onComplete: displayVideo, onError: handleRecorderError });

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError(copy.errors.notVideo);
      return;
    }
    try {
      const duration = await getVideoDuration(file);
      if (!Number.isFinite(duration) || duration > MAX_VIDEO_SECONDS + 0.1) {
        setError(copy.errors.tooLong);
        return;
      }
      displayVideo(file, duration);
    } catch {
      setError(copy.errors.unreadable);
    }
  };

  const analyseVideo = async () => {
    if (!videoUrl) return;
    setError(null);
    setView("analysing");
    setAnalysisStep(0);
    const interval = window.setInterval(() => {
      setAnalysisStep((current) => Math.min(current + 1, copy.analysis.steps.length - 1));
    }, 850);
    try {
      const capturedFrames = await extractFrames(videoUrl, videoDuration);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: capturedFrames, duration: videoDuration, locale }),
      });
      if (!response.ok) throw new Error("Analysis request failed");
      const data = (await response.json()) as AnalysisResponse;
      setHighlights(data.highlights);
      setVisualSource(data.visualSource);
    } catch {
      setHighlights(getFallbackHighlights(videoDuration, locale));
      setVisualSource("placeholder");
    } finally {
      window.clearInterval(interval);
      setSelected(0);
      setView("results");
    }
  };

  const selectHighlight = (highlight: VideoHighlight, index: number) => {
    setSelected(index);
    if (resultVideoRef.current) {
      resultVideoRef.current.currentTime = highlight.start;
      void resultVideoRef.current.play();
    }
  };

  const startOver = () => {
    recorder.stopTracks();
    clearVideo();
    setHighlights([]);
    setSelected(0);
    setView("idle");
  };

  const exportSelection = async (highlight: VideoHighlight) => {
    if (!highlight?.image) return;
    const slug = highlight.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "moment";
    const typeMatch = /^data:image\/([a-z0-9+.-]+)[;,]/i.exec(highlight.image);
    const subtype = typeMatch?.[1]?.toLowerCase() ?? "png";
    const extension = subtype === "svg+xml" ? "svg" : subtype;
    const filename = `mevid-${slug}.${extension}`;

    try {
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.share && nav.canShare) {
        const blob = await (await fetch(highlight.image)).blob();
        const file = new File([blob], filename, { type: blob.type || `image/${extension}` });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: highlight.title });
          return;
        }
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
    }

    const link = document.createElement("a");
    link.href = highlight.image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (mobileState === "checking") {
    return <main className="min-h-dvh bg-[#f8f7fb]" />;
  }

  if (mobileState === "desktop") {
    return <DesktopGate copy={copy} />;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f8f7fb] text-[#232331]">
      <DotGrid />
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] pl-[calc(1.25rem+env(safe-area-inset-left))] pr-[calc(1.25rem+env(safe-area-inset-right))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pl-[calc(2rem+env(safe-area-inset-left))] sm:pr-[calc(2rem+env(safe-area-inset-right))]">
        <header className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} copy={copy} onChange={setLocale} />
            <div className="hidden items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 text-xs font-semibold text-[#666474] shadow-sm backdrop-blur-sm sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#ff5c82]" />SHIPATON 2026</div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {recorder.isRecording ? <RecordingScreen key="recording" copy={copy} elapsed={recorder.elapsed} videoRef={recorder.liveVideoRef} onCancel={recorder.cancelRecording} onStop={recorder.stopRecording} /> : null}
          {!recorder.isRecording && view === "idle" ? <IntroScreen key="idle" copy={copy} inputRef={inputRef} onRecord={recorder.startRecording} onUpload={() => inputRef.current?.click()} onFileChange={handleUpload} /> : null}
          {!recorder.isRecording && view === "review" && videoUrl ? <ReviewScreen key="review" copy={copy} videoUrl={videoUrl} duration={videoDuration} onRetry={startOver} onAnalyse={analyseVideo} /> : null}
          {!recorder.isRecording && view === "analysing" ? <AnalysisScreen key="analysing" copy={copy} step={analysisStep} /> : null}
          {!recorder.isRecording && view === "results" && videoUrl ? <ResultsScreen key="results" copy={copy} videoUrl={videoUrl} duration={videoDuration} highlights={highlights} selected={selected} visualSource={visualSource} videoRef={resultVideoRef} onNewVideo={startOver} onSelect={selectHighlight} onExport={exportSelection} /> : null}
        </AnimatePresence>

        <footer className="mt-auto flex items-center justify-between pt-5 text-[11px] font-medium text-[#aaa7b1]"><span>{copy.footer.left}</span><span className="hidden sm:block">{copy.footer.right}</span></footer>
      </div>
      <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#ffc8d3] bg-white px-4 py-3 text-sm text-[#9d3450] shadow-xl"><span>{error}</span><button aria-label="Dismiss" onClick={() => setError(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
    </main>
  );
}
