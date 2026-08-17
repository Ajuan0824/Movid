export type Locale = "en" | "es";

export type VideoFrame = {
  time: number;
  image: string;
};

export type VideoHighlight = {
  start: number;
  end: number;
  score: number;
  title: string;
  reason: string;
  visualPrompt: string;
  image: string;
};

export type AnalysisSource = "openai" | "local";
export type VisualSource = "generated" | "placeholder";

export type AnalysisResponse = {
  highlights: VideoHighlight[];
  source: AnalysisSource;
  visualSource: VisualSource;
};
