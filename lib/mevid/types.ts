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

export type AnalysisSource = "openai" | "local";

export type AnalysisResponse = {
  highlights: VideoHighlight[];
  source: AnalysisSource;
};
