"use client";

import { FolderOpen, Hand, LoaderCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, iosSpring, screenTransition } from "../../../lib/mevid/motion";
import type { VideoHighlight } from "../../../lib/mevid/types";
import { formatSeconds } from "../../../lib/mevid/video";

type AnalysisScreenProps = {
  copy: AppCopy;
  step: number;
  /** The clip being analysed. Null only if it went away mid-flow. */
  videoUrl: string | null;
  duration: number;
  /** In-point of the kept window inside the (uncut) source clip. */
  trimStart?: number;
  /**
   * The real moments, once the model has answered — null while it's still
   * thinking. The magnifier hunts for exactly as long as that takes; only then
   * does the hand start filing them away, so the folder filling up means the
   * analysis genuinely finished rather than a timer running out.
   */
  found?: VideoHighlight[] | null;
};

/** Where the hand lifts each moment out of the frame, as stage percentages. */
const GRAB_POINTS = [
  { x: 28, y: 20 },
  { x: 70, y: 15 },
  { x: 47, y: 33 },
  { x: 75, y: 36 },
  { x: 24, y: 39 },
];
/** The wandering path the magnifier sweeps while the model is still working. */
const HUNT_PATH = [
  { x: 24, y: 22 },
  { x: 66, y: 15 },
  { x: 78, y: 34 },
  { x: 45, y: 40 },
  { x: 20, y: 33 },
  { x: 24, y: 22 },
];
const FOLDER_POINT = { x: 50, y: 87 };

/** A beat for the magnifier to settle on the first moment before the hand dives in. */
export const CAPTURE_LEAD_MS = 620;
/** Gap between one moment being lifted and the next. */
export const CAPTURE_EVERY_MS = 1150;
/** How long a single card takes to travel from the frame to the folder. */
const CAPTURE_FLIGHT_SECONDS = 1.9;
/** Reach in · hold the grab · carry it down. Shared by the card and the hand. */
const FLIGHT_TIMES = [0, 0.3, 0.46, 1];
const FLIGHT_EASE = [0.22, 1, 0.36, 1] as const;

/** How long the whole filing sequence runs, so the caller can wait it out. */
export function captureSequenceMs(count: number): number {
  if (count <= 0) return 0;
  return CAPTURE_LEAD_MS + (count - 1) * CAPTURE_EVERY_MS + CAPTURE_FLIGHT_SECONDS * 1000 + 320;
}

export function AnalysisScreen({ copy, step, videoUrl, duration, trimStart = 0, found = null }: AnalysisScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Indices currently mid-flight — they overlap, so this is a list, not one. */
  const [flights, setFlights] = useState<number[]>([]);
  /** Where the magnifier is parked once it stops hunting. */
  const [spot, setSpot] = useState(0);
  const [filed, setFiled] = useState(0);

  const moments = found ?? [];
  const hunting = moments.length === 0;

  // Loop playback inside the kept window — the stored file is never cut, so the
  // window has to be enforced here the same way the results screen does it.
  useEffect(() => {
    const node = videoRef.current;
    if (!node || !videoUrl) return;
    const windowEnd = trimStart + duration;
    const restart = () => {
      node.currentTime = trimStart;
      void node.play().catch(() => {});
    };
    const onTime = () => {
      if (node.currentTime >= windowEnd - 0.05) restart();
    };
    node.addEventListener("loadedmetadata", restart);
    node.addEventListener("timeupdate", onTime);
    if (node.readyState >= 1) restart();
    return () => {
      node.removeEventListener("loadedmetadata", restart);
      node.removeEventListener("timeupdate", onTime);
    };
  }, [videoUrl, trimStart, duration]);

  // Once the real moments land, walk the magnifier over each one in turn and
  // send the hand in after it.
  //
  // Both the launch and the landing run off timers rather than framer's
  // onAnimationComplete: rAF is frozen while the app is backgrounded, so a
  // callback-driven counter would stick at zero if the user switched away
  // mid-sequence. Timers keep this in lockstep with captureSequenceMs().
  useEffect(() => {
    if (!found || found.length === 0) return;
    const timers: number[] = [];
    found.forEach((_, index) => {
      const liftOff = CAPTURE_LEAD_MS + index * CAPTURE_EVERY_MS;
      timers.push(
        window.setTimeout(() => {
          setSpot(index);
          setFlights((current) => [...current, index]);
        }, liftOff),
      );
      timers.push(
        window.setTimeout(() => {
          setFiled((current) => current + 1);
          setFlights((current) => current.filter((entry) => entry !== index));
        }, liftOff + CAPTURE_FLIGHT_SECONDS * 1000),
      );
    });
    return () => timers.forEach(window.clearTimeout);
  }, [found]);

  const magnifierPoint = hunting ? null : GRAB_POINTS[Math.min(spot, GRAB_POINTS.length - 1)];

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={screenTransition}
      className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-6 text-center"
    >
      <motion.div variants={heroTextVariants} initial="hidden" animate="visible" className="flex w-full flex-col items-center">
        <motion.div
          variants={heroTextItemVariants}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:bg-[#2c2740] dark:text-[#c4b3ff]"
        >
          <LoaderCircle size={13} className="animate-spin" />
          {copy.analysis.eyebrow}
        </motion.div>
      </motion.div>

      {/* ---------- the stage: video up top, folder below ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...iosSpring, delay: 0.1 }}
        className="relative mx-auto w-full max-w-[330px]"
      >
        <div className="glass-panel relative overflow-hidden rounded-[26px] p-2 shadow-panel">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[19px] bg-[#1a1824]">
            {videoUrl ? (
              <video ref={videoRef} src={videoUrl} muted playsInline autoPlay className="h-full w-full object-cover" />
            ) : (
              <div className="camera-wash absolute inset-0" />
            )}
            <div className="scan-sweep" />
            <span className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 rounded-tl-sm border-l-2 border-t-2 border-white/45" />
            <span className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 rounded-tr-sm border-r-2 border-t-2 border-white/45" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 rounded-bl-sm border-b-2 border-l-2 border-white/45" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 rounded-br-sm border-b-2 border-r-2 border-white/45" />
          </div>
        </div>

        {/* the folder the moments land in */}
        <div className="mt-3.5 flex flex-col items-center">
          <motion.div
            key={filed}
            animate={{ scale: [1, 0.9, 1.09, 1], rotate: [0, -3, 2, 0] }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative grid h-[54px] w-[68px] place-items-center rounded-2xl bg-gradient-to-br from-[#7657dd] to-[#f0629a] text-white shadow-[0_12px_28px_rgba(118,87,221,.38)]"
          >
            <FolderOpen size={26} strokeWidth={2.2} />
            <AnimatePresence>
              {filed > 0 ? (
                <motion.span
                  key={filed}
                  initial={{ scale: 0, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={iosSpring}
                  className="absolute -right-2.5 -top-2.5 grid h-6 min-w-[24px] place-items-center rounded-full border-2 border-[#f8f7fb] bg-[#242432] px-1 font-mono text-[11px] font-bold text-white dark:border-[#121018]"
                >
                  {filed}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.div>
          <p className="mt-2 text-xs font-bold text-[#5c3fc4] dark:text-[#c4b3ff]">{copy.results.moments}</p>
        </div>

        {/* ---------- the magnifier: sweeps while the model thinks, then points ---------- */}
        <motion.div
          className="pointer-events-none absolute z-20"
          animate={
            magnifierPoint
              ? { left: `${magnifierPoint.x}%`, top: `${magnifierPoint.y}%`, x: "-50%", y: "-50%" }
              : {
                  left: HUNT_PATH.map((point) => `${point.x}%`),
                  top: HUNT_PATH.map((point) => `${point.y}%`),
                  x: "-50%",
                  y: "-50%",
                }
          }
          transition={
            magnifierPoint
              ? { ...iosSpring }
              : { duration: 11, times: [0, 0.2, 0.4, 0.6, 0.8, 1], repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* the little circles it traces as it scans */}
          <motion.div
            animate={{ x: [0, 7, 0, -7, 0], y: [0, -7, 0, 7, 0], rotate: [-7, 5, -7, 5, -7] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative grid place-items-center"
          >
            <motion.span
              className="absolute h-11 w-11 rounded-full border-2 border-[#c4b3ff]/70"
              animate={{ scale: [1, 1.45, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative text-white drop-shadow-[0_5px_12px_rgba(0,0,0,.55)]">
              <Search size={30} strokeWidth={2.4} />
            </span>
          </motion.div>
        </motion.div>

        {/* ---------- each found moment, carried down by the hand ---------- */}
        <AnimatePresence>
          {flights.map((index) => {
            const moment = moments[index];
            const point = GRAB_POINTS[index % GRAB_POINTS.length];
            if (!moment) return null;
            return (
              <motion.div
                key={index}
                className="pointer-events-none absolute z-30"
                initial={{ left: `${point.x}%`, top: `${point.y}%`, x: "-50%", y: "-50%", scale: 0.5, opacity: 0, rotate: -12 }}
                animate={{
                  left: [`${point.x}%`, `${point.x}%`, `${point.x}%`, `${FOLDER_POINT.x}%`],
                  top: [`${point.y}%`, `${point.y}%`, `${point.y}%`, `${FOLDER_POINT.y}%`],
                  x: "-50%",
                  y: "-50%",
                  scale: [0.5, 1, 1, 0.18],
                  opacity: [0, 1, 1, 0.85],
                  rotate: [-12, -4, -4, 10],
                }}
                exit={{ opacity: 0, scale: 0.08, transition: { duration: 0.18 } }}
                transition={{ duration: CAPTURE_FLIGHT_SECONDS, times: FLIGHT_TIMES, ease: FLIGHT_EASE }}
              >
                <div className="relative">
                  <motion.span
                    className="absolute -left-3 -top-2 h-1.5 w-1.5 rounded-full bg-[#ffd36e]"
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="absolute -bottom-1.5 -right-3 h-1 w-1 rounded-full bg-[#ff8fb0]"
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: 0.25, ease: "easeInOut" }}
                  />

                  <div className="overflow-hidden rounded-[14px] border-[3px] border-white bg-[#241f33] shadow-[0_14px_32px_rgba(36,29,80,.42)]">
                    <div className="relative h-[64px] w-[94px]">
                      {moment.image ? (
                        <span
                          className="absolute inset-0"
                          style={{ backgroundImage: `url(${moment.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        />
                      ) : (
                        <span className="camera-wash absolute inset-0" />
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-px font-mono text-[8px] font-bold text-white">
                        {formatSeconds(moment.start)}
                      </span>
                    </div>
                  </div>

                  <motion.span
                    className="absolute -right-4 -top-5 text-white drop-shadow-[0_5px_12px_rgba(0,0,0,.5)]"
                    animate={{ rotate: [-32, -12, -12, -3], scale: [0.5, 1, 0.86, 0.95] }}
                    transition={{ duration: CAPTURE_FLIGHT_SECONDS, times: FLIGHT_TIMES, ease: FLIGHT_EASE }}
                  >
                    <Hand size={30} strokeWidth={2.2} fill="rgba(255,255,255,.16)" />
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={heroTextVariants} initial="hidden" animate="visible" className="w-full">
        <motion.h1
          variants={heroTextItemVariants}
          className="mt-7 font-display text-[27px] font-bold leading-[1.06] tracking-[-0.05em] sm:text-4xl"
        >
          {copy.analysis.title}
        </motion.h1>
        <motion.p variants={heroTextItemVariants} className="mt-3 min-h-5 text-sm font-medium text-[#777481] dark:text-[#a79fb5]">
          {copy.analysis.steps[step]}
        </motion.p>
      </motion.div>

      {/* While the model works the steps cycle, so the bar travels instead of
          sitting full — filling every bar is reserved for the real answer. */}
      <div className="mt-6 flex gap-2">
        {copy.analysis.steps.map((item, index) => (
          <span
            key={item}
            className={`h-1.5 w-10 rounded-full transition-colors duration-500 ${
              hunting ? (index === step ? "bg-[#7657dd]" : "bg-[#e6e3eb] dark:bg-white/12") : "bg-[#7657dd]"
            }`}
          />
        ))}
      </div>
    </motion.section>
  );
}
