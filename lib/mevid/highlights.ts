import type { Locale } from "./types";

const momentLabel: Record<Locale, string> = {
  en: "Moment",
  es: "Momento",
};

/** Used to repair individual items when the AI response is missing a title for that entry. */
export function getDefaultHighlightLabels(locale: Locale): string[] {
  return Array.from({ length: 5 }, (_, index) => `${momentLabel[locale]} ${index + 1}`);
}
