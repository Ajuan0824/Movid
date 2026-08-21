import type { VideoFrame } from "./types";

export const MAX_VIDEO_SECONDS = 15;

export function formatTime(value: number) {
  const seconds = Math.max(0, Math.min(value, MAX_VIDEO_SECONDS));
  return `00:${seconds.toFixed(1).padStart(4, "0")}`;
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`;
}

function waitForEvent(element: HTMLVideoElement, event: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const complete = () => {
      element.removeEventListener(event, complete);
      element.removeEventListener("error", fail);
      resolve();
    };
    const fail = () => {
      element.removeEventListener(event, complete);
      element.removeEventListener("error", fail);
      reject(new Error("Unable to read the video."));
    };
    element.addEventListener(event, complete, { once: true });
    element.addEventListener("error", fail, { once: true });
  });
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

export async function extractFrames(source: string, durationHint: number): Promise<VideoFrame[]> {
  const video = await loadVideoElement(source);
  const duration = Number.isFinite(video.duration) ? video.duration : durationHint;
  const sampleCount = 10;
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

/** Re-opens the original video and grabs one full-resolution JPEG at each highlight's peak instant, so results show real footage instead of AI-generated art. */
export async function hydrateHighlightImages<T extends { start: number; peakTime: number }>(
  source: string,
  highlights: T[],
  durationHint: number,
): Promise<(T & { image: string })[]> {
  const video = await loadVideoElement(source);
  const duration = Number.isFinite(video.duration) ? video.duration : durationHint;
  const { canvas, context } = createCanvas(video, 1280);

  const hydrated: (T & { image: string })[] = [];
  for (const highlight of highlights) {
    const target = Number.isFinite(highlight.peakTime) ? highlight.peakTime : highlight.start;
    const time = Math.min(duration - 0.05, Math.max(0, target));
    video.currentTime = time;
    await waitForEvent(video, "seeked");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    hydrated.push({ ...highlight, image: canvas.toDataURL("image/jpeg", 0.92) });
  }
  video.removeAttribute("src");
  video.load();
  return hydrated;
}
