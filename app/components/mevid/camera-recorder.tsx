"use client";

import { motion } from "framer-motion";
import { SwitchCamera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { pickRecorderMimeType } from "../../../lib/mevid/recorder";
import { MAX_VIDEO_SECONDS } from "../../../lib/mevid/video";

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TICK_MS = 50;

type Status = "starting" | "ready" | "recording" | "error";

type CameraRecorderProps = {
  copy: AppCopy;
  onCancel: () => void;
  onRecorded: (video: Blob, duration: number) => void;
};

export function CameraRecorder({ copy, onCancel, onRecorded }: CameraRecorderProps) {
  const t = copy.camera;
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | undefined>(undefined);
  const startedAtRef = useRef(0);

  const [status, setStatus] = useState<Status>("starting");
  // Rear camera by default — it's the higher-resolution sensor and what people
  // point at the thing they're filming.
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [elapsed, setElapsed] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Re-runs when the camera is flipped: the old stream must be torn down
  // before asking for the other lens, or the device stays busy.
  useEffect(() => {
    let cancelled = false;
    setStatus("starting");

    void navigator.mediaDevices
      .getUserMedia({
        // `ideal` (not `exact`) so a camera that can't hit 1080p still starts,
        // just at its best available resolution instead of a low default.
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (previewRef.current) previewRef.current.srcObject = stream;
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Camera unavailable", error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, stopStream]);

  useEffect(() => () => {
    if (tickRef.current !== undefined) window.clearInterval(tickRef.current);
  }, []);

  const stopRecording = useCallback(() => {
    if (tickRef.current !== undefined) {
      window.clearInterval(tickRef.current);
      tickRef.current = undefined;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickRecorderMimeType();
    // ~8 Mbps keeps the extracted frames crisp; MediaRecorder's default is much
    // lower and is a big part of why recordings looked soft.
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 8_000_000,
    });
    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      // Measured from the wall clock: the file itself carries no duration.
      const seconds = Math.min((Date.now() - startedAtRef.current) / 1000, MAX_VIDEO_SECONDS);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "video/mp4" });
      stopStream();
      if (blob.size > 0) onRecorded(blob, seconds);
      else onCancel();
    };

    startedAtRef.current = Date.now();
    setElapsed(0);
    setStatus("recording");
    recorder.start();

    tickRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      // The whole point of the in-app camera: cut it off at the limit instead
      // of letting someone film a minute and get told it's too long after.
      if (seconds >= MAX_VIDEO_SECONDS) stopRecording();
    }, TICK_MS);
  };

  const recording = status === "recording";
  const progress = Math.min(elapsed / MAX_VIDEO_SECONDS, 1);
  const remaining = Math.max(0, MAX_VIDEO_SECONDS - elapsed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-black"
    >
      <video
        ref={previewRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
      />

      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          <p className="text-sm leading-6 text-white/85">{t.permissionDenied}</p>
        </div>
      ) : null}

      <div className="relative flex items-start justify-between p-[calc(1rem+env(safe-area-inset-top))_1rem_0]">
        <button
          type="button"
          onClick={() => {
            tapHaptic();
            stopStream();
            onCancel();
          }}
          aria-label={copy.auth.profile.close}
          className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <X size={22} />
        </button>

        <span className="rounded-full bg-black/45 px-3.5 py-2 font-mono text-sm font-bold text-white backdrop-blur-sm">
          {recording ? `${remaining.toFixed(1)}s` : t.maxHint}
        </span>

        <button
          type="button"
          disabled={recording}
          onClick={() => {
            tapHaptic();
            setFacing((current) => (current === "user" ? "environment" : "user"));
          }}
          aria-label={t.flip}
          className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-30"
        >
          <SwitchCamera size={22} />
        </button>
      </div>

      <div className="relative mt-auto flex items-center justify-center pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={status === "starting" || status === "error"}
          onClick={() => {
            tapHaptic();
            if (recording) stopRecording();
            else startRecording();
          }}
          aria-label={recording ? t.stop : t.start}
          className="relative grid h-[104px] w-[104px] place-items-center disabled:opacity-40"
        >
          <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90">
            <circle cx="52" cy="52" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="6" />
            <circle
              cx="52"
              cy="52"
              r={RING_RADIUS}
              fill="none"
              stroke="#ff5c82"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <span
            className={`bg-[#ff5c82] transition-all duration-200 ${recording ? "h-9 w-9 rounded-[9px]" : "h-[76px] w-[76px] rounded-full"}`}
          />
        </button>
      </div>
    </motion.div>
  );
}
