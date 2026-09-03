"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import type { VideoFrame } from "../../../lib/mevid/types";
import { extractFilmstrip, formatSeconds, MAX_VIDEO_SECONDS, MIN_VIDEO_SECONDS } from "../../../lib/mevid/video";

const STRIP_FRAMES = 10;

export type TrimValue = { start: number; end: number };

type VideoTrimmerProps = {
  copy: AppCopy;
  videoUrl: string;
  sourceDuration: number;
  value: TrimValue;
  /** Fired once when a drag settles. */
  onChange: (value: TrimValue) => void;
};

type DragMode = "start" | "end" | "window";
type Drag = { mode: DragMode; pointerId: number; originX: number; from: TrimValue };

/**
 * Instagram-style trimmer: a scrubbable filmstrip with two draggable handles.
 * The window is clamped to [MIN_VIDEO_SECONDS, MAX_VIDEO_SECONDS]; the file is
 * never re-encoded — the parent stores the picked in-point and analyses only
 * that slice.
 */
export function VideoTrimmer({ copy, videoUrl, sourceDuration, value, onChange }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const [frames, setFrames] = useState<VideoFrame[] | null>(null);
  const [stripFailed, setStripFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Local while dragging so the parent tree doesn't re-render on every move.
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    setDraft(value);
  }, [value.start, value.end]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setFrames(null);
    setStripFailed(false);
    extractFilmstrip(videoUrl, sourceDuration, STRIP_FRAMES)
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setStripFailed(true);
      });
    return () => {
      active = false;
    };
  }, [videoUrl, sourceDuration]);

  const pct = useCallback(
    (seconds: number) => `${Math.max(0, Math.min(100, (seconds / sourceDuration) * 100))}%`,
    [sourceDuration],
  );

  const scrubTo = useCallback((seconds: number) => {
    const node = videoRef.current;
    if (!node) return;
    if (!node.paused) node.pause();
    setPlaying(false);
    try {
      node.currentTime = seconds;
    } catch {
      // A not-yet-seekable video just ignores the scrub.
    }
  }, []);

  // Loop playback inside the selected window.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const onTime = () => {
      if (node.currentTime >= draft.end - 0.03 || node.currentTime < draft.start - 0.25) {
        node.currentTime = draft.start;
      }
    };
    node.addEventListener("timeupdate", onTime);
    return () => node.removeEventListener("timeupdate", onTime);
  }, [draft.start, draft.end]);

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      if (node.currentTime < draft.start || node.currentTime >= draft.end - 0.05) node.currentTime = draft.start;
      void node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  const beginDrag = (mode: DragMode) => (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, pointerId: event.pointerId, originX: event.clientX, from: draft };
    tapHaptic();
    if (mode === "start") scrubTo(draft.start);
    else if (mode === "end") scrubTo(Math.max(draft.start, draft.end - 0.1));
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !rect || rect.width === 0) return;
    const delta = ((event.clientX - drag.originX) / rect.width) * sourceDuration;

    let next: TrimValue;
    if (drag.mode === "start") {
      let start = drag.from.start + delta;
      start = Math.min(start, drag.from.end - MIN_VIDEO_SECONDS);
      start = Math.max(start, 0, drag.from.end - MAX_VIDEO_SECONDS);
      next = { start, end: drag.from.end };
      scrubTo(start);
    } else if (drag.mode === "end") {
      let end = drag.from.end + delta;
      end = Math.max(end, drag.from.start + MIN_VIDEO_SECONDS);
      end = Math.min(end, sourceDuration, drag.from.start + MAX_VIDEO_SECONDS);
      next = { start: drag.from.start, end };
      scrubTo(Math.max(drag.from.start, end - 0.1));
    } else {
      const span = drag.from.end - drag.from.start;
      const start = Math.max(0, Math.min(drag.from.start + delta, sourceDuration - span));
      next = { start, end: start + span };
      scrubTo(start);
    }

    setDraft(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
    dragRef.current = null;
    onChange(draftRef.current);
  };

  const dragProps = (mode: DragMode) => ({
    onPointerDown: beginDrag(mode),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  const selectedLength = draft.end - draft.start;

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="glass-panel overflow-hidden rounded-[28px] p-2 shadow-panel">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#17151f]">
          <video ref={videoRef} src={videoUrl} className="h-full w-full object-contain" playsInline muted preload="auto" />
          <button
            type="button"
            onClick={togglePlay}
            aria-label={copy.review.preview}
            className="absolute inset-0 grid place-items-center"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#242432] shadow-lg transition-opacity ${
                playing ? "opacity-0" : "opacity-100"
              }`}
            >
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </span>
          </button>
          <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm">
            {formatSeconds(selectedLength)}
          </div>
        </div>

        <div
          ref={trackRef}
          className="relative mt-2 h-16 touch-none select-none overflow-hidden rounded-[14px] bg-[#17151f]"
        >
          <div className="absolute inset-0 flex">
            {frames
              ? frames.map((frame, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={index} src={frame.image} alt="" draggable={false} className="h-full flex-1 object-cover" />
                ))
              : stripFailed
                ? null
                : Array.from({ length: STRIP_FRAMES }).map((_, index) => (
                    <div key={index} className="h-full flex-1 animate-pulse bg-white/[0.06]" />
                  ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 bg-black/55" style={{ width: pct(draft.start) }} />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-black/55"
            style={{ width: pct(sourceDuration - draft.end) }}
          />

          <div
            className="absolute inset-y-0 cursor-grab border-y-[3px] border-[#ff5c82] active:cursor-grabbing"
            style={{ left: pct(draft.start), width: pct(selectedLength) }}
            {...dragProps("window")}
          />

          <button
            type="button"
            aria-label={copy.review.trimStartHandle}
            className="absolute inset-y-0 grid w-7 -translate-x-1/2 cursor-ew-resize touch-none place-items-center rounded-l-[7px] bg-[#ff5c82] shadow-lg"
            style={{ left: pct(draft.start) }}
            {...dragProps("start")}
          >
            <span className="h-5 w-[3px] rounded-full bg-white" />
          </button>
          <button
            type="button"
            aria-label={copy.review.trimEndHandle}
            className="absolute inset-y-0 grid w-7 -translate-x-1/2 cursor-ew-resize touch-none place-items-center rounded-r-[7px] bg-[#ff5c82] shadow-lg"
            style={{ left: pct(draft.end) }}
            {...dragProps("end")}
          >
            <span className="h-5 w-[3px] rounded-full bg-white" />
          </button>
        </div>

        <p className="px-2 pb-1 pt-2.5 text-center text-xs text-[#8f8b99] dark:text-[#a79fb5]">{copy.review.trimHint}</p>
      </div>
    </div>
  );
}
