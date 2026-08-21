"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AccountScreen } from "./components/mevid/account-screen";
import { AnalysisScreen } from "./components/mevid/analysis-screen";
import { AccountMenu } from "./components/mevid/account-menu";
import { AuthGate } from "./components/auth/auth-gate";
import { Brand } from "./components/mevid/brand";
import { DesktopGate } from "./components/mevid/desktop-gate";
import { DotGrid } from "./components/mevid/dot-grid";
import { IntroScreen } from "./components/mevid/intro-screen";
import { LanguageSwitcher } from "./components/mevid/language-switcher";
import { ProScreen } from "./components/mevid/pro-screen";
import { ResultsScreen } from "./components/mevid/results-screen";
import { ReviewScreen } from "./components/mevid/review-screen";
import { TabBar, type AppTab } from "./components/mevid/tab-bar";
import { useAuth } from "../hooks/use-auth";
import { useIsMobile } from "../hooks/use-is-mobile";
import { getCopy } from "../lib/mevid/copy";
import { getFallbackHighlights } from "../lib/mevid/highlights";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../lib/mevid/motion";
import type { AnalysisResponse, Locale, VideoHighlight } from "../lib/mevid/types";
import { extractFrames, getVideoDuration, hydrateHighlightImages, MAX_VIDEO_SECONDS } from "../lib/mevid/video";

type FlowView = "idle" | "review" | "analysing";

export default function Home() {
  const mobileState = useIsMobile();
  const { status: authStatus } = useAuth();
  const [locale, setLocale] = useState<Locale>("en");
  const [tab, setTab] = useState<AppTab>("home");
  const [flowView, setFlowView] = useState<FlowView>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(MAX_VIDEO_SECONDS);
  const [highlights, setHighlights] = useState<VideoHighlight[]>([]);
  const [selected, setSelected] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const recordInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
    setFlowView("review");
  }, [clearVideo]);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  /** Shared by both the native-camera capture input and the gallery upload input. */
  const handleVideoFile = async (file: File) => {
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

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleVideoFile(file);
  };

  const analyseVideo = async () => {
    if (!videoUrl) return;
    setError(null);
    setFlowView("analysing");
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
      const hydrated = await hydrateHighlightImages(videoUrl, data.highlights, videoDuration);
      setHighlights(hydrated);
    } catch {
      try {
        const fallback = await hydrateHighlightImages(videoUrl, getFallbackHighlights(videoDuration, locale), videoDuration);
        setHighlights(fallback);
      } catch {
        setHighlights(getFallbackHighlights(videoDuration, locale));
      }
    } finally {
      window.clearInterval(interval);
      setSelected(0);
      setChecked(new Set());
      setFlowView("idle");
      setTab("momentos");
    }
  };

  const toggleChecked = (index: number) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectHighlight = (highlight: VideoHighlight, index: number) => {
    setSelected(index);
    if (resultVideoRef.current) {
      resultVideoRef.current.currentTime = highlight.start;
      void resultVideoRef.current.play();
    }
  };

  const startOver = () => {
    clearVideo();
    setHighlights([]);
    setSelected(0);
    setChecked(new Set());
    setFlowView("idle");
    setTab("home");
  };

  /** useShare tries the native share sheet first (nice for a single image); batches skip it so multiple picks download reliably without repeated share prompts. */
  const exportHighlight = async (highlight: VideoHighlight, useShare = true) => {
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

    if (useShare) {
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
    }

    const link = document.createElement("a");
    link.href = highlight.image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadChecked = async () => {
    const selection = highlights.filter((_, index) => checked.has(index));
    const useShare = selection.length === 1;
    for (const highlight of selection) {
      await exportHighlight(highlight, useShare);
    }
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
      <div className={`relative mx-auto flex min-h-dvh w-full max-w-xl flex-col pl-[calc(1.25rem+env(safe-area-inset-left))] pr-[calc(1.25rem+env(safe-area-inset-right))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pl-[calc(2rem+env(safe-area-inset-left))] sm:pr-[calc(2rem+env(safe-area-inset-right))] ${authStatus === "signed-in" ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]"}`}>
        <header className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} copy={copy} onChange={setLocale} />
            <AccountMenu copy={copy} />
            <div className="hidden items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 text-xs font-semibold text-[#666474] shadow-sm backdrop-blur-sm sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#ff5c82]" />SHIPATON 2026</div>
          </div>
        </header>

        <AuthGate copy={copy}>
          <AnimatePresence mode="wait">
            {tab === "home" && flowView === "idle" ? (
              <IntroScreen
                key="home-idle"
                copy={copy}
                recordInputRef={recordInputRef}
                uploadInputRef={uploadInputRef}
                onRecord={() => recordInputRef.current?.click()}
                onUpload={() => uploadInputRef.current?.click()}
                onRecordFileChange={handleFileInputChange}
                onUploadFileChange={handleFileInputChange}
              />
            ) : null}
            {tab === "home" && flowView === "review" && videoUrl ? <ReviewScreen key="home-review" copy={copy} videoUrl={videoUrl} duration={videoDuration} onRetry={startOver} onAnalyse={analyseVideo} /> : null}
            {tab === "home" && flowView === "analysing" ? <AnalysisScreen key="home-analysing" copy={copy} step={analysisStep} /> : null}

            {tab === "momentos" && highlights.length > 0 && videoUrl ? (
              <ResultsScreen
                key="momentos"
                copy={copy}
                videoUrl={videoUrl}
                duration={videoDuration}
                highlights={highlights}
                selected={selected}
                checked={checked}
                videoRef={resultVideoRef}
                onNewVideo={startOver}
                onSelect={selectHighlight}
                onToggleCheck={toggleChecked}
                onDownloadOne={(highlight) => void exportHighlight(highlight, true)}
                onDownloadChecked={downloadChecked}
              />
            ) : null}
            {tab === "momentos" && !(highlights.length > 0 && videoUrl) ? (
              <motion.section key="momentos-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-16 text-center">
                <motion.div variants={heroTextVariants} initial="hidden" animate="visible">
                  <motion.div variants={heroTextItemVariants} className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd]"><Sparkles size={13} />{copy.results.eyebrow}</motion.div>
                  <motion.h1 variants={heroTextItemVariants} className="font-display text-3xl font-bold tracking-[-0.06em]">{copy.momentsEmpty.title}</motion.h1>
                  <motion.p variants={heroTextItemVariants} className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#6d6b79]">{copy.momentsEmpty.description}</motion.p>
                </motion.div>
                <motion.button whileTap={{ scale: tapScale }} onClick={() => setTab("home")} className="primary-button mt-6">{copy.momentsEmpty.cta}</motion.button>
              </motion.section>
            ) : null}

            {tab === "pro" ? <ProScreen key="pro" copy={copy} onCta={() => setNotice(copy.pro.comingSoon)} /> : null}
            {tab === "cuenta" ? <AccountScreen key="cuenta" copy={copy} onGoPro={() => setTab("pro")} /> : null}
          </AnimatePresence>

          <TabBar copy={copy} tab={tab} onChange={setTab} />
        </AuthGate>

        <footer className="mt-auto flex items-center justify-between pt-5 text-[11px] font-medium text-[#aaa7b1]"><span>{copy.footer.left}</span><span className="hidden sm:block">{copy.footer.right}</span></footer>
      </div>
      <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#ffc8d3] bg-white px-4 py-3 text-sm text-[#9d3450] shadow-xl"><span>{error}</span><button aria-label="Dismiss" onClick={() => setError(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
      <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#dfd4ff] bg-[#f0ecff] px-4 py-3 text-sm font-semibold text-[#5c3fc4] shadow-xl"><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
    </main>
  );
}
