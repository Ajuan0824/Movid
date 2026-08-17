"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_VIDEO_SECONDS } from "../lib/mevid/video";

type UseVideoRecorderOptions = {
  onComplete: (video: Blob, duration: number) => void;
  onError: (error: Error) => void;
};

export function useVideoRecorder({ onComplete, onError }: UseVideoRecorderOptions) {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const discardRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    discardRef.current = true;
    stopRecording();
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("unsupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }

      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(MediaRecorder.isTypeSupported);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;
      elapsedRef.current = 0;
      setElapsed(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recording = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        const shouldDiscard = discardRef.current;
        stopTracks();
        setIsRecording(false);
        if (!shouldDiscard) onComplete(recording, Math.max(0.8, elapsedRef.current));
      };
      setIsRecording(true);
      recorder.start(200);
    } catch (caughtError) {
      stopTracks();
      onError(caughtError instanceof Error ? caughtError : new Error("camera"));
    }
  }, [onComplete, onError, stopTracks]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        const next = Math.min(MAX_VIDEO_SECONDS, Number((current + 0.1).toFixed(1)));
        elapsedRef.current = next;
        return next;
      });
    }, 100);
    const stopTimer = window.setTimeout(stopRecording, MAX_VIDEO_SECONDS * 1000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stopTimer);
    };
  }, [isRecording, stopRecording]);

  useEffect(() => () => stopTracks(), [stopTracks]);

  return { liveVideoRef, elapsed, isRecording, startRecording, stopRecording, cancelRecording, stopTracks };
}
