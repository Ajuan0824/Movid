import type { VideoFrame } from "./types";

export const MAX_VIDEO_SECONDS = 15;

/** Shortest window the in-app trimmer will let you settle on. */
export const MIN_VIDEO_SECONDS = 3;

/**
 * Hard ceiling for an uploaded source clip. Longer than this and the filmstrip
 * seek/decode pass gets slow on phones and the upload balloons, so we reject it
 * up front rather than let the trimmer choke.
 */
export const MAX_SOURCE_SECONDS = 10 * 60;

/**
 * Frames handed to the AI. Denser sampling than the eye needs, because the
 * model can only place a moment as precisely as the timeline it was shown:
 * at 16 samples over 15s it sees one every ~0.9s instead of every 1.5s.
 * Keep `app/api/analyze/route.ts` in sync — it caps the array it accepts.
 */
export const SAMPLE_COUNT = 16;

/**
 * Candidate frames scored per highlight. Every one costs a seek and a decode,
 * which is the whole cost of this pass, so the number is a straight trade of
 * processing time for sharpness.
 */
const REFINE_CANDIDATES = 9;

/**
 * Blur is a loss of high-frequency detail, so the scoring canvas has to keep
 * enough resolution for that detail to still exist. At thumbnail size a
 * slightly soft frame and a crisp one downsample to nearly the same thing and
 * the metric can't separate them.
 */
const SCORING_WIDTH = 480;

/**
 * How much a candidate far from the AI's chosen instant is discounted. Keeps
 * the pick anchored to the moment that was actually chosen, while still
 * letting a clearly sharper frame further out win.
 */
const PEAK_BIAS = 0.35;

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

type FrameReadyVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
};

/**
 * iOS Safari will not decode frames from a `<video>` that was never attached to
 * the document, or never played: `drawImage` then copies black. So the element
 * is parked off-screen — 1px and nearly transparent, NOT `display:none` or
 * `visibility:hidden`, which put it right back in the undecoded case — and
 * nudged through a play/pause to prime the decoder before any seeking.
 */
async function loadVideoElement(source: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  // Attributes as well as properties: Safari reads these off the markup when it
  // decides whether inline playback without a gesture is allowed.
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.style.cssText =
    "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1";
  document.body.appendChild(video);
  video.src = source;

  try {
    await waitForEvent(video, "loadedmetadata");
    try {
      await video.play();
      video.pause();
    } catch {
      // A rejected play() isn't fatal: browsers that don't need the nudge still
      // decode fine from a plain seek.
    }
    return video;
  } catch (error) {
    releaseVideoElement(video);
    throw error;
  }
}

function releaseVideoElement(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.remove();
}

/**
 * `seeked` means the media element moved its playhead, not that a frame is
 * ready to draw. On iOS Safari that gap is real: drawing straight after
 * `seeked` copies the previous frame, or nothing. `requestVideoFrameCallback`
 * fires once a frame is actually presentable; where it doesn't exist, two
 * animation frames are the best proxy. Both are capped so a paused video that
 * never presents anything can't hang the analysis.
 */
function waitForPaintedFrame(video: HTMLVideoElement): Promise<void> {
  const requestFrame = (video as FrameReadyVideo).requestVideoFrameCallback;
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    if (typeof requestFrame === "function") {
      requestFrame.call(video, done);
      window.setTimeout(done, 400);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(done));
  });
}

/** Seeks and waits until the frame at that time is genuinely drawable. */
async function seekTo(video: HTMLVideoElement, time: number) {
  video.currentTime = time;
  await waitForEvent(video, "seeked");
  await waitForPaintedFrame(video);
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

/**
 * Clamp a [offset, offset + window] request inside footage that is `total`
 * seconds long, returning where sampling actually starts and how long it runs.
 */
function clampWindow(total: number, windowSeconds: number, offsetSeconds: number) {
  const span = Math.max(0.1, Math.min(windowSeconds, total));
  const start = Math.max(0, Math.min(offsetSeconds, total - span));
  return { start, span };
}

/**
 * Samples the trimmed window the user kept, not the whole file. Frame times are
 * reported relative to that window (0 = the trim's in-point) so the model and
 * the results timeline share one coordinate space; `offsetSeconds` is where
 * that window sits in the original clip.
 */
export async function extractFrames(
  source: string,
  windowSeconds: number,
  offsetSeconds = 0,
): Promise<VideoFrame[]> {
  const video = await loadVideoElement(source);
  try {
      const total = await resolveDuration(video, offsetSeconds + windowSeconds);
      const { start, span } = clampWindow(total, windowSeconds, offsetSeconds);
      const { canvas, context } = createCanvas(video, 480);

      const frames: VideoFrame[] = [];
      for (let index = 0; index < SAMPLE_COUNT; index += 1) {
        const local = Math.min(span - 0.05, Math.max(0, ((index + 0.5) / SAMPLE_COUNT) * span));
        await seekTo(video, start + local);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({ time: Number(local.toFixed(2)), image: canvas.toDataURL("image/jpeg", 0.68) });
      }
      return frames;
  } finally {
    releaseVideoElement(video);
  }
}

/**
 * Evenly spaced low-res stills across the whole source clip, for the trimmer's
 * scrubbable filmstrip. Cheap on purpose — small canvas, low JPEG quality.
 */
export async function extractFilmstrip(
  source: string,
  durationHint: number,
  count = 10,
): Promise<VideoFrame[]> {
  const video = await loadVideoElement(source);
  try {
    const total = await resolveDuration(video, durationHint);
    const { canvas, context } = createCanvas(video, 160);

    const frames: VideoFrame[] = [];
    for (let index = 0; index < count; index += 1) {
      const time = Math.min(total - 0.05, Math.max(0, ((index + 0.5) / count) * total));
      await seekTo(video, time);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ time: Number(time.toFixed(2)), image: canvas.toDataURL("image/jpeg", 0.5) });
    }
    return frames;
  } finally {
    releaseVideoElement(video);
  }
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
  windowSeconds: number,
  offsetSeconds = 0,
): Promise<(T & { image: string })[]> {
  const video = await loadVideoElement(source);
  try {
  const total = await resolveDuration(video, offsetSeconds + windowSeconds);
  const { start: base, span } = clampWindow(total, windowSeconds, offsetSeconds);
  // Highlight times come back relative to the trimmed window, so every seek is
  // offset by where that window starts in the original clip.
  const latest = Math.max(0, span - 0.05);
  const { canvas, context } = createCanvas(video, 1280);
  const scoring = createCanvas(video, SCORING_WIDTH);

  /** Window-relative seek: the caller's times start at the trim's in-point. */
  const seekLocal = (time: number) => seekTo(video, base + time);

  const hydrated: (T & { image: string })[] = [];
  for (const highlight of highlights) {
    const target = Number.isFinite(highlight.peakTime) ? highlight.peakTime : highlight.start;
    const centre = Math.min(latest, Math.max(0, target));

    // Search the whole moment the AI chose, not a slice of it — a sharp frame
    // anywhere inside it still shows that moment, and on shaky handheld
    // footage the crisp frames can be a second away from the nominal peak.
    // Straying outside [start, end] would be a different moment entirely.
    const lower = Math.max(0, Number.isFinite(highlight.start) ? highlight.start : centre);
    const upper = Math.min(latest, Number.isFinite(highlight.end) ? highlight.end : centre);

    let bestTime = centre;
    let bestScore = -1;

    if (upper > lower) {
      const halfSpan = Math.max((upper - lower) / 2, 0.001);
      for (let index = 0; index < REFINE_CANDIDATES; index += 1) {
        const time = lower + ((upper - lower) * index) / (REFINE_CANDIDATES - 1);
        try {
          await seekLocal(time);
          scoring.context.drawImage(video, 0, 0, scoring.canvas.width, scoring.canvas.height);
          const { data } = scoring.context.getImageData(0, 0, scoring.canvas.width, scoring.canvas.height);
          const distance = Math.min(Math.abs(time - centre) / halfSpan, 1);
          const score = frameQuality(data, scoring.canvas.width, scoring.canvas.height) * (1 - PEAK_BIAS * distance);
          if (score > bestScore) {
            bestScore = score;
            bestTime = time;
          }
        } catch {
          // A candidate that won't seek just doesn't compete.
        }
      }
    }

    await seekLocal(bestTime);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    hydrated.push({ ...highlight, image: canvas.toDataURL("image/jpeg", 0.92) });
  }

  return hydrated;
  } finally {
    releaseVideoElement(video);
  }
}
