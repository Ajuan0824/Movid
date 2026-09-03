export type Locale = "en" | "es";

export type VideoFrame = {
  time: number;
  image: string;
};

export type VideoHighlight = {
  start: number;
  end: number;
  peakTime: number;
  title: string;
  image: string;
};

/**
 * One saved run of the analyser. `videoUrl` and each highlight's `image` are
 * remote download URLs once stored, or local object/data URLs while the upload
 * is still in flight (`pending`).
 */
export type StoredGeneration = {
  id: string;
  createdAt: Date;
  /** Length of the kept window, in seconds (<= MAX_VIDEO_SECONDS). */
  duration: number;
  /** Where that window starts in the stored (untrimmed) `videoUrl` clip. */
  trimStart: number;
  videoUrl: string;
  highlights: VideoHighlight[];
  pending?: boolean;
};

export type AnalysisResponse = {
  highlights: VideoHighlight[];
};
