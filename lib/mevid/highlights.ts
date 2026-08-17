import type { Locale, VideoHighlight } from "./types";

const defaultHighlights: Record<Locale, ReadonlyArray<readonly [string, string]>> = {
  en: [
    ["The hook", "An opening that immediately grabs attention."],
    ["Energy peak", "The visually most intense moment."],
    ["Scene shift", "A natural change that lands well in an edit."],
    ["Real reaction", "The clip’s most expressive, authentic beat."],
    ["Strong finish", "A clean ending that leaves a mark."],
  ],
  es: [
    ["El gancho", "Un arranque que atrapa al instante."],
    ["Pico de energía", "El momento con más intensidad visual."],
    ["Cambio de plano", "Un corte natural que funciona muy bien."],
    ["La reacción", "La expresión más auténtica del clip."],
    ["Cierre redondo", "Un final perfecto para dejar huella."],
  ],
};

const visualPalettes = [
  ["#3c246e", "#ee6b8d"],
  ["#143d5b", "#63c6d9"],
  ["#6f3c22", "#f6b949"],
  ["#29355f", "#ae89f8"],
  ["#4d2348", "#f580a6"],
];

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] as string);
}

export function createMomentPlaceholder(index: number, title: string) {
  const [from, to] = visualPalettes[index % visualPalettes.length];
  const safeTitle = escapeSvgText(title);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768" fill="none"><defs><linearGradient id="g" x1="54" y1="72" x2="700" y2="710" gradientUnits="userSpaceOnUse"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="34"/></filter></defs><rect width="768" height="768" fill="url(#g)"/><circle cx="148" cy="171" r="138" fill="#fff" fill-opacity=".18" filter="url(#b)"/><circle cx="640" cy="609" r="172" fill="#fff" fill-opacity=".16" filter="url(#b)"/><path d="M269 302c0-22 24-36 43-25l153 89c19 11 19 39 0 50l-153 89c-19 11-43-3-43-25V302Z" fill="white" fill-opacity=".93"/><text x="54" y="656" fill="white" fill-opacity=".72" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4">MEVID MOMENT</text><text x="54" y="704" fill="white" font-family="Arial, sans-serif" font-size="33" font-weight="700">${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getFallbackHighlights(duration: number, locale: Locale): VideoHighlight[] {
  const safeDuration = Math.max(duration || 15, 5);
  return defaultHighlights[locale].map(([title, reason], index) => {
    const window = 1.3;
    const center = ((index + 0.75) / 5.5) * safeDuration;
    const start = Math.max(0, Math.min(center - window / 2, safeDuration - window));
    return {
      title,
      reason,
      start: Number(start.toFixed(1)),
      end: Number(Math.min(start + window, safeDuration).toFixed(1)),
      score: 98 - index * 4,
      visualPrompt: `${title}. ${reason}`,
      image: createMomentPlaceholder(index, title),
    };
  });
}

export function getDefaultHighlightLabels(locale: Locale) {
  return defaultHighlights[locale];
}
