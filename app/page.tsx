"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AccountScreen } from "./components/mevid/account-screen";
import { AnalysisScreen, captureSequenceMs } from "./components/mevid/analysis-screen";
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
import { HeaderStars } from "./components/mevid/star-meter";
import { StarsEmptyModal } from "./components/mevid/stars-empty-modal";
import { TabBar, type AppTab } from "./components/mevid/tab-bar";
import { useGenerations } from "../hooks/use-generations";
import { usePlan } from "../hooks/use-plan";
import { usePurchases } from "../hooks/use-purchases";
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
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
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
  const { plan, limit: starsTotal, starsLeft, ready: planReady, error: planError, spend: spendStar, reload: reloadPlan } = usePlan();
  const purchases = usePurchases();
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
  // The moments the model actually returned; drives the folder animation.
  const [analysisFound, setAnalysisFound] = useState<VideoHighlight[] | null>(null);
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

  /**
   * Tab navigation. Leaving Moments closes whatever moment was open, so coming
   * back lands on the library instead of the video you were last looking at.
   * The analysis flow sets the tab directly — it opens a moment on purpose.
   */
  const changeTab = useCallback((next: AppTab) => {
    if (next !== "momentos") setOpenGenerationId(null);
    setTab(next);
  }, []);

  const handleSubscribe = useCallback(
    async (billing: "monthly" | "yearly") => {
      const outcome = await purchases.subscribe(billing);
      if (outcome === "ok") setNotice(copy.pro.activating);
      else if (outcome === "unavailable") setNotice(copy.pro.unavailable);
      else if (outcome === "error") setError(copy.pro.errorGeneric);
      // "cancelled" — the user backed out, say nothing.
    },
    [purchases, copy.pro],
  );

  const handleRestore = useCallback(async () => {
    const outcome = await purchases.restore();
    if (outcome === "restored") setNotice(copy.pro.restoredOk);
    else if (outcome === "nothing") setNotice(copy.pro.restoreNothing);
    else if (outcome === "unavailable") setNotice(copy.pro.unavailable);
    else if (outcome === "error") setError(copy.pro.errorGeneric);
  }, [purchases, copy.pro]);

  // The Pro tab is hidden for subscribers, so don't strand one on it — it can
  // still be the active tab if the plan resolved while they were viewing it.
  useEffect(() => {
    if (planReady && plan === "pro" && tab === "pro") changeTab("home");
  }, [planReady, plan, tab, changeTab]);

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
    if (planError) {
      // The plan doc couldn't be read — "0 stars" here means "unknown", not
      // "used up", so don't send them to the upsell modal.
      setError(copy.errors.planUnavailable);
      reloadPlan();
      return;
    }
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
    setAnalysisFound(null);
    // Cycles rather than capping: the model takes as long as it takes, and a
    // progress bar frozen at "done" while we're still waiting reads as stuck.
    const interval = window.setInterval(() => {
      setAnalysisStep((current) => (current + 1) % copy.analysis.steps.length);
    }, 1700);

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

    // Hand the real moments to the analysis screen and let the hand actually
    // file them away before we move on. The magnifier hunted for exactly as
    // long as the model took, so the folder filling up is a real signal.
    setAnalysisFound(hydrated);
    await new Promise((resolve) => window.setTimeout(resolve, captureSequenceMs(hydrated.length)));

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
    setAnalysisFound(null);
    setFlowView("idle");
    setTab("home");
  };

  const openGenerationFromLibrary = (generation: StoredGeneration) => {
    setSelected(0);
    setChecked(new Set());
    setOpenGenerationId(generation.id);
  };

  const slugify = (title: string) =>
    title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "moment";

  /**
   * Builds a File for one highlight image. Stored generations point at Firebase
   * Storage URLs, which send no CORS headers — routing them through /api/asset
   * keeps the fetch same-origin so we can hand a real file to the share sheet.
   * A bare <a download> just navigates the WebView to the image on iOS.
   */
  const highlightToFile = async (highlight: VideoHighlight): Promise<File> => {
    const src = /^https?:/i.test(highlight.image)
      ? `/api/asset?url=${encodeURIComponent(highlight.image)}`
      : highlight.image;
    const blob = await (await fetch(src)).blob();
    const subtype = (blob.type.split("/")[1] ?? "jpeg").toLowerCase();
    const extension = subtype === "svg+xml" ? "svg" : subtype === "jpeg" ? "jpg" : subtype;
    return new File([blob], `MoVid-${slugify(highlight.title)}.${extension}`, { type: blob.type || "image/jpeg" });
  };

  /**
   * One share sheet for the whole set (iOS/Android: "Save N Images", "Save to
   * Files", share…). Desktop browsers with no Web Share fall back to real file
   * downloads. Never navigates away; an empty set is a no-op.
   */
  const downloadHighlights = async (items: VideoHighlight[]) => {
    const targets = items.filter((highlight) => highlight?.image);
    if (targets.length === 0) return;
    try {
      const files = await Promise.all(targets.map(highlightToFile));
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files })) {
        await nav.share({ files, title: files.length === 1 ? targets[0].title : copy.results.title });
        return;
      }
      for (const file of files) {
        const href = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = href;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(href);
      }
    } catch (downloadError) {
      // The user dismissing the share sheet throws AbortError — not a failure.
      if (downloadError instanceof DOMException && downloadError.name === "AbortError") return;
      console.error("Download failed", downloadError);
      setError(copy.errors.downloadFailed);
    }
  };

  const downloadChecked = () =>
    downloadHighlights((openGeneration?.highlights ?? []).filter((_, index) => checked.has(index)));

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
        <header className="flex shrink-0 items-center justify-between gap-2">
          <Brand />
          <div className="flex items-center gap-2">
            {planReady && !planError ? (
              <HeaderStars
                copy={copy}
                left={starsLeft}
                total={starsTotal}
                onClick={() => changeTab(plan === "pro" ? "cuenta" : "pro")}
              />
            ) : null}
            <AccountMenu
              copy={copy}
              onManageAccount={() => changeTab("cuenta")}
              localePref={localePref}
              onLocalePrefChange={setLocalePref}
              themePref={themePref}
              onThemePrefChange={setThemePref}
            />
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
              />
            ) : null}
            {tab === "home" && flowView === "review" && videoUrl ? <ReviewScreen key="home-review" copy={copy} videoUrl={videoUrl} duration={videoDuration} sourceDuration={sourceDuration} trimStart={trimStart} onTrimChange={handleTrimChange} onRetry={startOver} onAnalyse={analyseVideo} /> : null}
            {tab === "home" && flowView === "analysing" ? <AnalysisScreen key="home-analysing" copy={copy} step={analysisStep} videoUrl={videoUrl} duration={videoDuration} trimStart={trimStart} found={analysisFound} /> : null}

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
                onDownloadOne={(highlight) => void downloadHighlights([highlight])}
                onDownloadChecked={() => void downloadChecked()}
              />
            ) : null}
            {tab === "momentos" && !openGeneration ? (
              <MomentsLibrary
                key="momentos-library"
                copy={copy}
                generations={generations}
                onOpen={openGenerationFromLibrary}
                onDelete={(generation) => void removeGeneration(generation)}
                onGoHome={() => changeTab("home")}
              />
            ) : null}

            {tab === "pro" ? (
              <ProScreen
                key="pro"
                copy={copy}
                available={purchases.available}
                busy={purchases.busy}
                monthlyPrice={purchases.monthlyPrice}
                yearlyPrice={purchases.yearlyPrice}
                yearlyPerMonthPrice={purchases.yearlyPerMonthPrice}
                onSubscribe={handleSubscribe}
                onRestore={handleRestore}
              />
            ) : null}
            {tab === "cuenta" ? <AccountScreen key="cuenta" copy={copy} onGoPro={() => changeTab("pro")} /> : null}
          </AnimatePresence>
          </div>

          <TabBar copy={copy} tab={tab} onChange={changeTab} />
          <AnimatePresence>
            {starsEmptyOpen ? (
              <StarsEmptyModal
                copy={copy}
                locale={locale}
                plan={plan}
                total={starsTotal}
                onClose={() => setStarsEmptyOpen(false)}
                onGoPro={() => changeTab("pro")}
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
