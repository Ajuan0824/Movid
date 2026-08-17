import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getDefaultHighlightLabels, getFallbackHighlights } from "../../../lib/mevid/highlights";
import { addMomentVisuals } from "../../../lib/server/moment-visuals";
import { logServerError } from "../../../lib/server/log";
import type { Locale, VideoHighlight } from "../../../lib/mevid/types";

type AnalyseRequest = {
  frames?: Array<{ time: number; image: string }>;
  duration?: number;
  locale?: Locale;
};

function parseHighlights(raw: string, duration: number, locale: Locale): VideoHighlight[] | null {
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { highlights?: unknown };
    if (!Array.isArray(parsed.highlights) || parsed.highlights.length < 5) return null;
    const defaults = getDefaultHighlightLabels(locale);
    return parsed.highlights.slice(0, 5).map((item, index) => {
      const highlight = item as Partial<VideoHighlight>;
      const start = Math.max(0, Math.min(Number(highlight.start) || 0, duration));
      const end = Math.max(start + 0.2, Math.min(Number(highlight.end) || start + 1, duration));
      const title = String(highlight.title || defaults[index][0]).slice(0, 36);
      const reason = String(highlight.reason || defaults[index][1]).slice(0, 90);
      return {
        start: Number(start.toFixed(1)),
        end: Number(end.toFixed(1)),
        score: Math.max(1, Math.min(100, Math.round(Number(highlight.score) || 90 - index * 4))),
        title,
        reason,
        visualPrompt: String(highlight.visualPrompt || `${title}. ${reason}`).slice(0, 360),
        image: "",
      };
    });
  } catch (error) {
    logServerError("analyze:parse-highlights", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyseRequest;
    const duration = Math.max(1, Math.min(Number(body.duration) || 15, 15));
    const locale: Locale = body.locale === "es" ? "es" : "en";
    const frames = (body.frames ?? []).filter((frame) => typeof frame.time === "number" && typeof frame.image === "string").slice(0, 10);

    if (!process.env.OPENAI_API_KEY || frames.length === 0) {
      return NextResponse.json({ highlights: getFallbackHighlights(duration, locale), source: "local", visualSource: "placeholder" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const manifest = frames.map((frame, index) => `Frame ${index + 1}: t=${frame.time.toFixed(2)} s`).join(". ");
    const language = locale === "es" ? "Spanish" : "English";
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You are a social video editor. Analyse these frames from a ${duration.toFixed(1)}-second video. Select exactly 5 visually distinct, memorable and shareable micro-moments. Every moment must last from 0.5 to 3 seconds, fall between 0 and ${duration.toFixed(1)}, and avoid overlapping substantially. ${manifest}. Return ONLY valid JSON in this shape: {"highlights":[{"start":number,"end":number,"score":number,"title":string,"reason":string,"visualPrompt":string}]}. visualPrompt is a precise visual description of what happened in that moment, suitable to generate an image; do not mention frame, screenshot, UI or timestamps. Write title, reason and visualPrompt in ${language}; title has a maximum of 4 words and reason a maximum of 12 words.`,
          },
          ...frames.map((frame) => ({ type: "input_image" as const, image_url: frame.image, detail: "low" as const })),
        ],
      }],
      max_output_tokens: 700,
    });

    const highlights = parseHighlights(response.output_text, duration, locale);
    if (!highlights) {
      return NextResponse.json({ highlights: getFallbackHighlights(duration, locale), source: "local", visualSource: "placeholder" });
    }
    const visualised = await addMomentVisuals(client, highlights, locale);
    return NextResponse.json({ highlights: visualised.highlights, source: "openai", visualSource: visualised.visualSource });
  } catch (error) {
    logServerError("analyze:request", error);
    return NextResponse.json({ highlights: getFallbackHighlights(15, "en"), source: "local", visualSource: "placeholder" });
  }
}
