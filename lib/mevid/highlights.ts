import type { Locale, VideoHighlight } from "./types";

const momentLabel: Record<Locale, string> = {
  en: "Moment",
  es: "Momento",
};

/** Used to repair individual items when the AI response is missing a title for that entry. */
export function getDefaultHighlightLabels(locale: Locale): string[] {
  return Array.from({ length: 5 }, (_, index) => `${momentLabel[locale]} ${index + 1}`);
}

/** Used when no AI analysis ran at all (no API key, or the request failed). */
export function getFallbackHighlights(duration: number, locale: Locale): VideoHighlight[] {
  const safeDuration = Math.max(duration || 15, 5);
  return Array.from({ length: 5 }, (_, index) => {
    const window = 1.3;
    const center = ((index + 0.75) / 5.5) * safeDuration;
    const start = Math.max(0, Math.min(center - window / 2, safeDuration - window));
    const end = Number(Math.min(start + window, safeDuration).toFixed(1));
    return {
      title: `${momentLabel[locale]} ${index + 1}`,
      start: Number(start.toFixed(1)),
      end,
      peakTime: Number(((start + end) / 2).toFixed(2)),
      image: "",
    };
  });
}
