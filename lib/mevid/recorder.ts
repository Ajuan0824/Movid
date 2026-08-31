/**
 * Codec support splits by browser: Chrome/Android record WebM, Safari/iOS
 * record MP4. Ordered best-first; an empty string lets MediaRecorder pick its
 * own default, which is better than refusing to record.
 */
const MIME_CANDIDATES = [
  "video/mp4;codecs=h264,aac",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

/**
 * getUserMedia only exists in a secure context (https, localhost or a native
 * scheme). Served over plain http — as the Capacitor dev config does — it is
 * undefined, so the caller falls back to the OS camera app.
 */
export function isInAppCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}
