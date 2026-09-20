"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import type { VideoFrame } from "../../../lib/mevid/types";
import {
  extractFilmstrip,
  formatSeconds,
  MAX_VIDEO_SECONDS,
  MIN_VIDEO_SECONDS,
} from "../../../lib/mevid/video";

const STRIP_FRAMES = 10;

export type TrimValue = { start: number; end: number };

type VideoTrimmerProps = {
  copy: AppCopy;
  videoUrl: string;
  sourceDuration: number;
  /** Longest window this plan can keep — 15s on free, 30s on Pro. */
  maxSeconds?: number;
  value: TrimValue;
  /** Fired once when a drag settles. */
  onChange: (value: TrimValue) => void;
};

type DragMode = "start" | "end" | "window";
type Drag = {
  mode: DragMode;
  pointerId: number;
  originX: number;
  from: TrimValue;
};

/**
 * Instagram-style trimmer: a scrubbable filmstrip with two draggable handles.
 * The window is clamped to [MIN_VIDEO_SECONDS, maxSeconds]; the file is
 * never re-encoded — the parent stores the picked in-point and analyses only
 * that slice.
 *
 * Playback and the moving playhead are driven straight from the <video> via a
 * single rAF loop that writes DOM styles — never React state — so the preview
 * stays smooth and never fights a re-render on a phone.
 */
export function VideoTrimmer({
  copy,
  videoUrl,
  sourceDuration,
  maxSeconds = MAX_VIDEO_SECONDS,
  value,
  onChange,
}: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const [frames, setFrames] = useState<VideoFrame[] | null>(null);
  const [stripFailed, setStripFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Local while dragging so the parent tree doesn't re-render on every move.
  const [draft, setDraft] = useState(value);
  // Latest window for the rAF loop and pointer handlers without re-subscribing.
  const winRef = useRef(draft);
  winRef.current = draft;

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
    (seconds: number) =>
      `${Math.max(0, Math.min(100, (seconds / sourceDuration) * 100))}%`,
    [sourceDuration],
  );

  // One loop for the life of the component: keeps playback inside the window
  // and paints the playhead from the real currentTime (covers scrubbing too).
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      const node = videoRef.current;
      const head = playheadRef.current;
      if (node && head && sourceDuration > 0) {
        const { start, end } = winRef.current;
        if (!node.paused && node.currentTime >= end - 0.03)
          node.currentTime = start;
        const t = Math.min(end, Math.max(start, node.currentTime || start));
        head.style.left = `${(t / sourceDuration) * 100}%`;
      }
    };
    const tick = () => {
      paint();
      raf = requestAnimationFrame(tick);
    };
    paint(); // no first-frame flash at the left edge
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sourceDuration]);

  const scrubTo = useCallback((seconds: number) => {
    const node = videoRef.current;
    if (!node) return;
    node.pause();
    try {
      node.currentTime = seconds;
    } catch {
      // A not-yet-seekable video just ignores the scrub.
    }
  }, []);

  const play = useCallback((from?: number) => {
    const node = videoRef.current;
    if (!node) return;
    const { start, end } = winRef.current;
    const target =
      from ??
      (node.currentTime < start || node.currentTime >= end - 0.05
        ? start
        : node.currentTime);
    try {
      node.currentTime = target;
    } catch {
      // ignore
    }
    node.play().catch(() => {
      // Autoplay/interrupted — the button stays in its "play" state.
    });
  }, []);

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) play();
    else node.pause();
  };

  const beginDrag =
    (mode: DragMode) => (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      // Capture keeps moves flowing while the finger strays off the element; if
      // the browser refuses it, the track-level listeners below still catch them.
      try {
        trackRef.current?.setPointerCapture(event.pointerId);
      } catch {
        // No active pointer / unsupported — fall back to bubbled events.
      }
      dragRef.current = {
        mode,
        pointerId: event.pointerId,
        originX: event.clientX,
        from: winRef.current,
      };
      tapHaptic();
      const { start, end } = winRef.current;
      if (mode === "start") scrubTo(start);
      else if (mode === "end") scrubTo(Math.max(start, end - 0.1));
    };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const rect = trackRef.current?.getBoundingClientRect();
    if (
      !drag ||
      drag.pointerId !== event.pointerId ||
      !rect ||
      rect.width === 0
    )
      return;
    const delta =
      ((event.clientX - drag.originX) / rect.width) * sourceDuration;

    let next: TrimValue;
    if (drag.mode === "start") {
      let start = drag.from.start + delta;
      start = Math.min(start, drag.from.end - MIN_VIDEO_SECONDS);
      start = Math.max(start, 0, drag.from.end - maxSeconds);
      next = { start, end: drag.from.end };
      scrubTo(start);
    } else if (drag.mode === "end") {
      let end = drag.from.end + delta;
      end = Math.max(end, drag.from.start + MIN_VIDEO_SECONDS);
      end = Math.min(end, sourceDuration, drag.from.start + maxSeconds);
      next = { start: drag.from.start, end };
      scrubTo(Math.max(drag.from.start, end - 0.1));
    } else {
      const span = drag.from.end - drag.from.start;
      const start = Math.max(
        0,
        Math.min(drag.from.start + delta, sourceDuration - span),
      );
      next = { start, end: start + span };
      scrubTo(start);
    }

    setDraft(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      trackRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
    dragRef.current = null;
    onChange(winRef.current);
  };

  // Move/up/cancel live on the track (an ancestor of every handle), so a
  // captured pointer and a bubbled one both land here exactly once.
  const trackDragProps = {
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  const selectedLength = draft.end - draft.start;

  // The visual handles are also accessible sliders. Keyboard and switch users
  // get the same limits as touch input; Shift adjusts a full second at a time.
  const nudgeHandle =
    (handle: "start" | "end") => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const window = winRef.current;
      const min =
        handle === "start"
          ? Math.max(0, window.end - maxSeconds)
          : window.start + MIN_VIDEO_SECONDS;
      const max =
        handle === "start"
          ? window.end - MIN_VIDEO_SECONDS
          : Math.min(sourceDuration, window.start + maxSeconds);
      const delta =
        (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 1 : 0.1);
      const seconds =
        event.key === "Home"
          ? min
          : event.key === "End"
            ? max
            : Math.min(max, Math.max(min, window[handle] + delta));
      const next = { ...window, [handle]: Number(seconds.toFixed(2)) };
      winRef.current = next;
      setDraft(next);
      scrubTo(
        handle === "start" ? next.start : Math.max(next.start, next.end - 0.1),
      );
      onChange(next);
    };

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="glass-panel overflow-hidden rounded-[28px] p-2 shadow-panel">
        <div className="trim-preview relative overflow-hidden rounded-[20px] bg-[#18231d]">
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-contain"
            playsInline
            muted
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => play(winRef.current.start)}
          />
          <button
            type="button"
            onClick={togglePlay}
            aria-label={copy.review.preview}
            className="absolute inset-0 grid place-items-center"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#25352d] shadow-lg transition-opacity ${
                playing ? "opacity-0" : "opacity-100"
              }`}
            >
              {playing ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" />
              )}
            </span>
          </button>
          <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm">
            {formatSeconds(selectedLength)}
          </div>
        </div>

        <div
          ref={trackRef}
          className="relative mt-2 h-16 touch-none select-none overflow-hidden rounded-[14px] bg-[#18231d]"
          {...trackDragProps}
        >
          <div className="absolute inset-0 flex">
            {frames
              ? frames.map((frame, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={index}
                    src={frame.image}
                    alt=""
                    draggable={false}
                    className="h-full flex-1 object-cover"
                  />
                ))
              : stripFailed
                ? null
                : Array.from({ length: STRIP_FRAMES }).map((_, index) => (
                    <div
                      key={index}
                      className="h-full flex-1 animate-pulse bg-white/[0.06]"
                    />
                  ))}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-black/55"
            style={{ width: pct(draft.start) }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-black/55"
            style={{ width: pct(sourceDuration - draft.end) }}
          />

          <div
            className="absolute inset-y-0 cursor-grab touch-none border-y-[3px] border-[#eb795e] active:cursor-grabbing"
            style={{ left: pct(draft.start), width: pct(selectedLength) }}
            onPointerDown={beginDrag("window")}
          />

          {/* Wide transparent hit area, hairline pink bar as the only visible mark. */}
          <button
            type="button"
            aria-label={copy.review.trimStartHandle}
            role="slider"
            aria-valuemin={Math.max(0, draft.end - maxSeconds)}
            aria-valuemax={draft.end - MIN_VIDEO_SECONDS}
            aria-valuenow={draft.start}
            aria-valuetext={formatSeconds(draft.start)}
            onKeyDown={nudgeHandle("start")}
            className="absolute inset-y-0 grid w-6 -translate-x-1/2 cursor-ew-resize touch-none place-items-center"
            style={{ left: pct(draft.start) }}
            onPointerDown={beginDrag("start")}
          >
            <span className="h-full w-[2px] rounded-full bg-[#eb795e] shadow-[0_0_4px_rgba(0,0,0,0.45)]" />
          </button>
          <button
            type="button"
            aria-label={copy.review.trimEndHandle}
            role="slider"
            aria-valuemin={draft.start + MIN_VIDEO_SECONDS}
            aria-valuemax={Math.min(sourceDuration, draft.start + maxSeconds)}
            aria-valuenow={draft.end}
            aria-valuetext={formatSeconds(draft.end)}
            onKeyDown={nudgeHandle("end")}
            className="absolute inset-y-0 grid w-6 -translate-x-1/2 cursor-ew-resize touch-none place-items-center"
            style={{ left: pct(draft.end) }}
            onPointerDown={beginDrag("end")}
          >
            <span className="h-full w-[2px] rounded-full bg-[#eb795e] shadow-[0_0_4px_rgba(0,0,0,0.45)]" />
          </button>

          <div
            ref={playheadRef}
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[2px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.7)]"
          >
            <span className="absolute left-1/2 top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-white" />
          </div>
        </div>

        <p className="px-2 pb-1 pt-2.5 text-center text-xs text-[#8f8b99] dark:text-[#a6b0a3]">
          {copy.review.trimHint.replace("{max}", String(maxSeconds))}
        </p>
      </div>
    </div>
  );
}
