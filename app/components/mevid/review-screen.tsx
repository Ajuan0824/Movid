"use client";
import { ArrowLeft, ArrowUpRight, Play, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { formatTime, MAX_VIDEO_SECONDS } from "../../../lib/mevid/video";
import { VideoTrimmer } from "./video-trimmer";
import { PageHeading, Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";
type ReviewScreenProps = {
  copy: AppCopy;
  videoUrl: string;
  duration: number;
  sourceDuration: number;
  trimStart: number;
  maxSeconds?: number;
  onTrimChange: (start: number, end: number) => void;
  onRetry: () => void;
  onAnalyse: () => void;
};
export function ReviewScreen({
  copy,
  videoUrl,
  duration,
  sourceDuration,
  trimStart,
  maxSeconds = MAX_VIDEO_SECONDS,
  onTrimChange,
  onRetry,
  onAnalyse,
}: ReviewScreenProps) {
  const [preview, setPreview] = useState(false);
  const needsTrim = sourceDuration > maxSeconds + 0.3;
  return (
    <Screen className="review-screen">
      <button
        className="flex min-h-11 shrink-0 items-center gap-2 self-start text-xs font-semibold"
        onClick={onRetry}
      >
        <ArrowLeft size={17} />
        {copy.review.retry}
      </button>
      <PageHeading
        eyebrow={copy.review.eyebrow}
        title={needsTrim ? copy.review.trimTitle : copy.review.title}
      />
      {needsTrim ? (
        <div className="flex flex-1 flex-col justify-center">
          <VideoTrimmer
            copy={copy}
            videoUrl={videoUrl}
            sourceDuration={sourceDuration}
            maxSeconds={maxSeconds}
            value={{ start: trimStart, end: trimStart + duration }}
            onChange={({ start, end }) => onTrimChange(start, end)}
          />
        </div>
      ) : (
        <button
          className="photo-stage"
          onClick={() => setPreview(true)}
          aria-label={copy.review.preview}
        >
          <video src={videoUrl} playsInline muted preload="metadata" />
          <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 font-mono text-xs text-white">
            {formatTime(duration)}
          </span>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
              <Play size={24} fill="currentColor" />
            </span>
          </span>
        </button>
      )}
      {!needsTrim && (
        <p className="text-center text-sm text-muted">
          {copy.review.description}
        </p>
      )}
      <div className="shrink-0">
        <button
          className="primary-button w-full justify-between"
          onClick={onAnalyse}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={18} />
            {copy.review.analyse}
          </span>
          <ArrowUpRight size={19} />
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Star size={12} />
          {copy.studio.oneStar}
        </p>
      </div>
      {preview && (
        <Sheet
          title={copy.review.preview}
          closeLabel={copy.auth.profile.close}
          onClose={() => setPreview(false)}
        >
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[70dvh] w-full rounded-2xl bg-black"
          />
        </Sheet>
      )}
    </Screen>
  );
}
