"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AccountScreen } from "./components/mevid/account-screen";
import { AnalysisScreen } from "./components/mevid/analysis-screen";
import { AccountMenu } from "./components/mevid/account-menu";
import { AuthGate } from "./components/auth/auth-gate";
import { Brand } from "./components/mevid/brand";
import { CameraRecorder } from "./components/mevid/camera-recorder";
import { DesktopGate } from "./components/mevid/desktop-gate";
import { DotGrid } from "./components/mevid/dot-grid";
import { IntroScreen } from "./components/mevid/intro-screen";
import { MomentsLibrary } from "./components/mevid/moments-library";
import { ProScreen } from "./components/mevid/pro-screen";
import { ResultsScreen } from "./components/mevid/results-screen";
import { ReviewScreen } from "./components/mevid/review-screen";
import { StarsEmptyModal } from "./components/mevid/stars-empty-modal";
import { TabBar, type AppTab } from "./components/mevid/tab-bar";
import { useGenerations } from "../hooks/use-generations";
import { usePlan } from "../hooks/use-plan";
import { useIsMobile } from "../hooks/use-is-mobile";
import { useLocalePref } from "../hooks/use-locale-pref";
import { useThemePref } from "../hooks/use-theme-pref";
import { getCopy } from "../lib/mevid/copy";
import { isInAppCameraSupported } from "../lib/mevid/recorder";
import type { AnalysisResponse, StoredGeneration, VideoHighlight } from "../lib/mevid/types";
import { extractFrames, getVideoDuration, hydrateHighlightImages, MAX_SOURCE_SECONDS, MAX_VIDEO_SECONDS } from "../lib/mevid/video";

type FlowView = "idle" | "review" | "analysing";

/**
 * Positioning lives on a plain wrapper, not on the animated element: Framer
 * Motion writes its own inline `transform`, which overrides Tailwind's
 * `-translate-x-1/2` and leaves the toast hanging off the right edge.
 */
function Toast({ tone, message, onDismiss }: { tone: "error" | "notice"; message: string; onDismiss: () => void }) {
  const palette =
    tone === "error"
      ? "border-[#ffc8d3] dark:border-[#5c2f3d] bg-white dark:bg-[#211e2c] text-[#9d3450] dark:text-[#ffb4c8]"
      : "border-[#dfd4ff] dark:border-[#4a3f73] bg-[#f0ecff] dark:bg-[#2c2740] font-semibold text-[#5c3fc4] dark:text-[#b9a6ff]";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className={`pointer-events-auto flex w-full max-w-md items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm leading-5 shadow-xl ${palette}`}
      >
        <span className="min-w-0 flex-1">{message}</span>
        <button aria-label="Dismiss" onClick={onDismiss} className="mt-0.5 shrink-0"><X size={16} /></button>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const mobileState = useIsMobile();
  const { plan, limit: starsTotal, starsLeft, ready: planReady, spend: spendStar } = usePlan();
  const { pref: localePref, locale, setPref: setLocalePref, ready: localeReady } = useLocalePref();
  const { pref: themePref, setPref: setThemePref } = useThemePref();
  const [tab, setTab] = useState<AppTab>("home");
  const [flowView, setFlowView] = useState<FlowView>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  // videoDuration is the kept window; sourceDuration is the full clip; trimStart
  // is where the window begins inside it (0 unless the trimmer moved it).
  const [videoDuration, setVideoDuration] = useState(MAX_VIDEO_SECONDS);
  const [sourceDuration, setSourceDuration] = useState(MAX_VIDEO_SECONDS);
  const [trimStart, setTrimStart] = useState(0);
  const [openGenerationId, setOpenGenerationId] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starsEmptyOpen, setStarsEmptyOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const recordInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);
  const copy = getCopy(locale);

  const { generations, save: saveGeneration, remove: removeGeneration } = useGenerations();
  const openGeneration = generations.find((entry) => entry.id === openGenerationId) ?? null;

  const clearVideo = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setVideoUrl(null);
  }, []);

  const displayVideo = useCallback((video: Blob, duration: number) => {
    clearVideo();
    const nextUrl = URL.createObjectURL(video);
    urlRef.current = nextUrl;
    videoBlobRef.current = video;
    setVideoUrl(nextUrl);
    setSourceDuration(duration);
    setTrimStart(0);
    // Default window: the first 15s (or the whole clip if it's shorter). The
    // trimmer, shown only for longer clips, moves it from here.
    setVideoDuration(Math.min(duration, MAX_VIDEO_SECONDS));
    setFlowView("review");
  }, [clearVideo]);

  const handleTrimChange = useCallback((start: number, end: number) => {
    setTrimStart(start);
    setVideoDuration(end - start);
  }, []);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  // The Pro tab is hidden for subscribers, so don't strand one on it — it can
  // still be the active tab if the plan resolved while they were viewing it.
  useEffect(() => {
    if (planReady && plan === "pro" && tab === "pro") setTab("home");
  }, [planReady, plan, tab]);

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
      if (!Number.isFinite(duration) || duration <= 0) {
        setError(copy.errors.unreadable);
        return;
      }
      if (duration > MAX_SOURCE_SECONDS) {
        setError(copy.errors.tooLong);
        return;
      }
      // Longer than 15s is fine now — the review screen shows a trimmer.
      displayVideo(file, duration);
    } catch {
      setError(copy.errors.unreadable);
    }
  };

  /** In-app camera when the browser allows it, OS camera app otherwise (it
   *  needs a secure context, which the plain-http dev server isn't). */
  const startRecording = () => {
    setError(null);
    if (isInAppCameraSupported()) setCameraOpen(true);
    else recordInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleVideoFile(file);
  };

  const analyseVideo = async () => {
    const videoBlob = videoBlobRef.current;
    if (!videoUrl || !videoBlob) return;
    if (starsLeft <= 0) {
      // starsLeft is only meaningful once the plan doc has loaded — before
      // that it's 0 by default, which isn't the same as "out of stars".
      if (planReady) setStarsEmptyOpen(true);
      else setError(copy.auth.errors.unknown);
      return;
    }
    setError(null);
    setFlowView("analysing");
    setAnalysisStep(0);
    const interval = window.setInterval(() => {
      setAnalysisStep((current) => Math.min(current + 1, copy.analysis.steps.length - 1));
    }, 850);

    // Which stage failed decides what we can honestly tell the user — the
    // three causes have completely different fixes.
    let errorKey: "analysisFailed" | "analysisUnavailable" | "analysisVideoUnreadable" = "analysisFailed";
    let hydrated: VideoHighlight[];
    try {
      let capturedFrames;
      try {
        capturedFrames = await extractFrames(videoUrl, videoDuration, trimStart);
      } catch (frameError) {
        errorKey = "analysisVideoUnreadable";
        throw frameError;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: capturedFrames, duration: videoDuration, locale }),
      });
      if (!response.ok) {
        // 503 is the server telling us it has no OpenAI key — retrying won't
        // help, so say so plainly instead of "try again later".
        if (response.status === 503) errorKey = "analysisUnavailable";
        throw new Error(`Analysis request failed (${response.status})`);
      }

      const data = (await response.json()) as AnalysisResponse;
      hydrated = await hydrateHighlightImages(videoUrl, data.highlights, videoDuration, trimStart);
    } catch (analysisError) {
      console.error(`Analysis failed [${errorKey}]`, analysisError);
      window.clearInterval(interval);
      // Back to the review screen with the clip intact, so retrying is one tap.
      setFlowView("review");
      setError(copy.errors[errorKey]);
      return;
    }
    window.clearInterval(interval);

    // Charged only now: billing a star for an analysis that failed would be
    // wrong, and refunding one from the client would let anyone zero out their
    // usage after already getting the result.
    if (!(await spendStar())) console.error("Analysis succeeded but the star could not be spent");

    // Renders straight away from local blobs; the upload settles in the background.
    const generationId = saveGeneration({ video: videoBlob, duration: videoDuration, trimStart, highlights: hydrated });
    setSelected(0);
    setChecked(new Set());
    setOpenGenerationId(generationId);
    setFlowView("idle");
    setTab("momentos");
  };

  const toggleChecked = (index: number) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectHighlight = (_highlight: VideoHighlight, index: number) => {
    setSelected(index);
  };

  const startOver = () => {
    clearVideo();
    videoBlobRef.current = null;
    setOpenGenerationId(null);
    setSelected(0);
    setChecked(new Set());
    setTrimStart(0);
    setVideoDuration(MAX_VIDEO_SECONDS);
    setSourceDuration(MAX_VIDEO_SECONDS);
    setFlowView("idle");
    setTab("home");
  };

  const openGenerationFromLibrary = (generation: StoredGeneration) => {
    setSelected(0);
    setChecked(new Set());
    setOpenGenerationId(generation.id);
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
    // Fresh results carry a data: URI; stored ones are remote JPEGs.
    const typeMatch = /^data:image\/([a-z0-9+.-]+)[;,]/i.exec(highlight.image);
    const subtype = typeMatch?.[1]?.toLowerCase() ?? "jpeg";
    const extension = subtype === "svg+xml" ? "svg" : subtype === "jpeg" ? "jpg" : subtype;
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
    const selection = (openGeneration?.highlights ?? []).filter((_, index) => checked.has(index));
    const useShare = selection.length === 1;
    for (const highlight of selection) {
      await exportHighlight(highlight, useShare);
    }
  };

  if (mobileState === "checking" || !localeReady) {
    return <main className="min-h-dvh bg-[#f8f7fb] dark:bg-[#121018]" />;
  }

  if (mobileState === "desktop") {
    return <DesktopGate copy={copy} />;
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#f8f7fb] dark:bg-[#121018] text-[#232331] dark:text-[#f1eff7]">
      <DotGrid />
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />
      <div className="relative mx-auto flex h-dvh w-full max-w-xl flex-col pl-[calc(1.25rem+env(safe-area-inset-left))] pr-[calc(1.25rem+env(safe-area-inset-right))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pl-[calc(2rem+env(safe-area-inset-left))] sm:pr-[calc(2rem+env(safe-area-inset-right))]">
        <header className="flex shrink-0 items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <AccountMenu
              copy={copy}
              onManageAccount={() => setTab("cuenta")}
              localePref={localePref}
              onLocalePrefChange={setLocalePref}
              themePref={themePref}
              onThemePrefChange={setThemePref}
            />
            <div className="hidden items-center gap-2 rounded-full border border-white dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-2 text-xs font-semibold text-[#666474] dark:text-[#b3aec0] shadow-sm backdrop-blur-sm sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#ff5c82]" />SHIPATON 2026</div>
          </div>
        </header>

        <AuthGate copy={copy} locale={locale}>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <AnimatePresence mode="wait">
            {tab === "home" && flowView === "idle" ? (
              <IntroScreen
                key="home-idle"
                copy={copy}
                recordInputRef={recordInputRef}
                uploadInputRef={uploadInputRef}
                onRecord={startRecording}
                onUpload={() => uploadInputRef.current?.click()}
                onRecordFileChange={handleFileInputChange}
                onUploadFileChange={handleFileInputChange}
                planReady={planReady}
                starsLeft={starsLeft}
                starsTotal={starsTotal}
              />
            ) : null}
            {tab === "home" && flowView === "review" && videoUrl ? <ReviewScreen key="home-review" copy={copy} videoUrl={videoUrl} duration={videoDuration} sourceDuration={sourceDuration} trimStart={trimStart} onTrimChange={handleTrimChange} onRetry={startOver} onAnalyse={analyseVideo} /> : null}
            {tab === "home" && flowView === "analysing" ? <AnalysisScreen key="home-analysing" copy={copy} step={analysisStep} /> : null}

            {tab === "momentos" && openGeneration ? (
              <ResultsScreen
                key="momentos-detail"
                copy={copy}
                videoUrl={openGeneration.videoUrl}
                duration={openGeneration.duration}
                trimStart={openGeneration.trimStart ?? 0}
                highlights={openGeneration.highlights}
                selected={selected}
                checked={checked}
                videoRef={resultVideoRef}
                onNewVideo={() => setOpenGenerationId(null)}
                newVideoLabel={copy.library.back}
                onSelect={selectHighlight}
                onToggleCheck={toggleChecked}
                onDownloadOne={(highlight) => void exportHighlight(highlight, true)}
                onDownloadChecked={downloadChecked}
              />
            ) : null}
            {tab === "momentos" && !openGeneration ? (
              <MomentsLibrary
                key="momentos-library"
                copy={copy}
                generations={generations}
                onOpen={openGenerationFromLibrary}
                onDelete={(generation) => void removeGeneration(generation)}
                onGoHome={() => setTab("home")}
              />
            ) : null}

            {tab === "pro" ? <ProScreen key="pro" copy={copy} onCta={() => setNotice(copy.pro.comingSoon)} /> : null}
            {tab === "cuenta" ? <AccountScreen key="cuenta" copy={copy} onGoPro={() => setTab("pro")} /> : null}
          </AnimatePresence>
          </div>

          <TabBar copy={copy} tab={tab} onChange={setTab} />
          <AnimatePresence>
            {starsEmptyOpen ? (
              <StarsEmptyModal
                copy={copy}
                locale={locale}
                plan={plan}
                total={starsTotal}
                onClose={() => setStarsEmptyOpen(false)}
                onGoPro={() => setTab("pro")}
              />
            ) : null}
          </AnimatePresence>
        </AuthGate>
      </div>
      <AnimatePresence>
        {cameraOpen ? (
          <CameraRecorder
            copy={copy}
            onCancel={() => setCameraOpen(false)}
            onRecorded={(video, duration) => {
              setCameraOpen(false);
              // Straight to displayVideo: a recording's own metadata has no
              // duration, so re-measuring it here would read as "too long".
              displayVideo(video, duration);
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{error ? <Toast key="error" tone="error" message={error} onDismiss={() => setError(null)} /> : null}</AnimatePresence>
      <AnimatePresence>{notice ? <Toast key="notice" tone="notice" message={notice} onDismiss={() => setNotice(null)} /> : null}</AnimatePresence>
    </main>
  );
}
