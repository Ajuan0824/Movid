import type { VideoFrame } from "./types";

export const MAX_VIDEO_SECONDS = 15;

/**
 * Frames handed to the AI. Denser sampling than the eye needs, because the
 * model can only place a moment as precisely as the timeline it was shown:
 * at 16 samples over 15s it sees one every ~0.9s instead of every 1.5s.
 * Keep `app/api/analyze/route.ts` in sync — it caps the array it accepts.
 */
export const SAMPLE_COUNT = 16;

/** Candidate frames scored around the AI's chosen instant, and how far either
 *  side of it we're willing to look for a sharper one. Every candidate costs a
 *  seek and a decode, so this is deliberately modest — 5 across a 0.8s window
 *  lands roughly every 6 frames at 30fps. */
const REFINE_CANDIDATES = 5;
const REFINE_WINDOW_SECONDS = 0.4;
const SCORING_WIDTH = 192;

export function formatTime(value: number) {
  const seconds = Math.max(0, Math.min(value, MAX_VIDEO_SECONDS));
  return `00:${seconds.toFixed(1).padStart(4, "0")}`;
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`;
}

const EVENT_TIMEOUT_MS = 8000;

/** The timeout matters for in-app recordings: a seek on a stream-recorded file
 * can silently never fire "seeked", which would otherwise hang the analysis. */
function waitForEvent(element: HTMLVideoElement, event: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener(event, complete);
      element.removeEventListener("error", fail);
      window.clearTimeout(timer);
    };
    const complete = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("Unable to read the video."));
    };
    const timer = window.setTimeout(fail, EVENT_TIMEOUT_MS);
    element.addEventListener(event, complete, { once: true });
    element.addEventListener("error", fail, { once: true });
  });
}

/**
 * MediaRecorder output carries no duration in its metadata, so `video.duration`
 * reads as Infinity and frame seeking misbehaves. Seeking far past the end
 * forces the browser to compute the real duration; if even that fails we fall
 * back to the length we measured while recording.
 */
async function resolveDuration(video: HTMLVideoElement, durationHint: number) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  try {
    video.currentTime = 1e7;
    await waitForEvent(video, "seeked");
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = 0;
      await waitForEvent(video, "seeked");
      return video.duration;
    }
  } catch {
    // Fall through to the hint.
  }
  return durationHint;
}

export async function getVideoDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = objectUrl;
  try {
    await waitForEvent(video, "loadedmetadata");
    return video.duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
  }
}

async function loadVideoElement(source: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = source;
  await waitForEvent(video, "loadedmetadata");
  return video;
}

function createCanvas(video: HTMLVideoElement, maxWidth: number) {
  const canvas = document.createElement("canvas");
  const aspectRatio = video.videoWidth / video.videoHeight || 9 / 16;
  canvas.width = Math.min(maxWidth, video.videoWidth || maxWidth);
  canvas.height = Math.round(canvas.width / aspectRatio);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Frame sampling is not supported in this browser.");
  return { canvas, context };
}

/**
 * How sharp and well-exposed a frame is, as a single number.
 *
 * Variance of the Laplacian is the standard blur measure: a crisp frame has
 * strong local intensity changes, a motion-blurred one doesn't. It also drops
 * to near zero on a frame that's black or blown out, which is exactly what we
 * want to avoid too — a mid-blink or lens-flare frame scores itself out.
 */
function frameQuality(pixels: Uint8ClampedArray, width: number, height: number): number {
  const gray = new Float32Array(width * height);
  let brightnessSum = 0;
  for (let index = 0, offset = 0; index < gray.length; index += 1, offset += 4) {
    const value = 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
    gray[index] = value;
    brightnessSum += value;
  }

  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        4 * gray[index] - gray[index - 1] - gray[index + 1] - gray[index - width] - gray[index + width];
      sum += laplacian;
      sumSquares += laplacian * laplacian;
      count += 1;
    }
  }
  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSquares / count - mean * mean;

  // Taper the score as the frame approaches pure black or pure white, so a
  // technically "detailed" but unusable exposure loses to a clean one.
  const brightness = brightnessSum / gray.length / 255;
  const exposure = Math.max(0, 1 - Math.pow(Math.abs(brightness - 0.5) * 2, 3));

  return variance * exposure;
}

export async function extractFrames(source: string, durationHint: number): Promise<VideoFrame[]> {
  const video = await loadVideoElement(source);
  const duration = await resolveDuration(video, durationHint);
  const sampleCount = SAMPLE_COUNT;
  const { canvas, context } = createCanvas(video, 480);

  const frames: VideoFrame[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const time = Math.min(duration - 0.05, Math.max(0, ((index + 0.5) / sampleCount) * duration));
    video.currentTime = time;
    await waitForEvent(video, "seeked");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({ time: Number(time.toFixed(2)), image: canvas.toDataURL("image/jpeg", 0.68) });
  }
  video.removeAttribute("src");
  video.load();
  return frames;
}

/**
 * Re-opens the original video and grabs one full-resolution JPEG per highlight,
 * so results show real footage instead of AI-generated art.
 *
 * The AI decides *which moment* matters, but it only ever saw a sparse sample
 * of the timeline, so the exact instant it names is often a frame nobody
 * looked at — and on anything fast-moving that frame is frequently a blurred
 * one. So around each chosen instant we score a handful of real candidate
 * frames and keep the crispest. The division of labour: the model picks the
 * moment, the pixels pick the frame.
 */
export async function hydrateHighlightImages<T extends { start: number; end: number; peakTime: number }>(
  source: string,
  highlights: T[],
  durationHint: number,
): Promise<(T & { image: string })[]> {
  const video = await loadVideoElement(source);
  const duration = await resolveDuration(video, durationHint);
  const latest = Math.max(0, duration - 0.05);
  const { canvas, context } = createCanvas(video, 1280);
  const scoring = createCanvas(video, SCORING_WIDTH);

  const seekTo = async (time: number) => {
    video.currentTime = time;
    await waitForEvent(video, "seeked");
  };

  const hydrated: (T & { image: string })[] = [];
  for (const highlight of highlights) {
    const target = Number.isFinite(highlight.peakTime) ? highlight.peakTime : highlight.start;
    const centre = Math.min(latest, Math.max(0, target));

    // Stay inside the moment the AI chose: a sharper frame from a different
    // moment would be the wrong picture, however pretty.
    const lower = Math.max(0, Number.isFinite(highlight.start) ? highlight.start : centre, centre - REFINE_WINDOW_SECONDS);
    const upper = Math.min(latest, Number.isFinite(highlight.end) ? highlight.end : centre, centre + REFINE_WINDOW_SECONDS);

    let bestTime = centre;
    let bestScore = -1;

    if (upper > lower) {
      for (let index = 0; index < REFINE_CANDIDATES; index += 1) {
        const time = lower + ((upper - lower) * index) / (REFINE_CANDIDATES - 1);
        try {
          await seekTo(time);
          scoring.context.drawImage(video, 0, 0, scoring.canvas.width, scoring.canvas.height);
          const { data } = scoring.context.getImageData(0, 0, scoring.canvas.width, scoring.canvas.height);
          const score = frameQuality(data, scoring.canvas.width, scoring.canvas.height);
          if (score > bestScore) {
            bestScore = score;
            bestTime = time;
          }
        } catch {
          // A candidate that won't seek just doesn't compete.
        }
      }
    }

    await seekTo(bestTime);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    hydrated.push({ ...highlight, image: canvas.toDataURL("image/jpeg", 0.92) });
  }

  video.removeAttribute("src");
  video.load();
  return hydrated;
}
