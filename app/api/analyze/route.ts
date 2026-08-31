import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getDefaultHighlightLabels } from "../../../lib/mevid/highlights";
import { logServerError } from "../../../lib/server/log";
import type { Locale, VideoHighlight } from "../../../lib/mevid/types";

/**
 * A vision call over 16 frames regularly runs past Vercel's 10s default, which
 * surfaces as a generic 500 on the client. 60s is the Hobby-plan ceiling.
 */
export const maxDuration = 60;

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
      const peakTime = Math.max(start, Math.min(Number(highlight.peakTime) || (start + end) / 2, end));
      const title = String(highlight.title || defaults[index]).slice(0, 36);
      return {
        start: Number(start.toFixed(1)),
        end: Number(end.toFixed(1)),
        peakTime: Number(peakTime.toFixed(2)),
        title,
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
    // Keep the cap in sync with SAMPLE_COUNT in lib/mevid/video.ts.
    const frames = (body.frames ?? []).filter((frame) => typeof frame.time === "number" && typeof frame.image === "string").slice(0, 16);

    if (frames.length === 0) {
      return NextResponse.json({ error: "no-frames" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      logServerError("analyze:config", new Error("OPENAI_API_KEY is not set"));
      return NextResponse.json({ error: "not-configured" }, { status: 503 });
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
            text: `You are a social video editor choosing which real frames to keep from a ${duration.toFixed(1)}-second video — you are not generating artwork.

Select exactly 5 visually distinct, memorable, shareable micro-moments.

Strongly prefer moments where:
- Faces are sharp, fully inside the frame, eyes open, with a readable expression. Never pick a mid-blink, a turned-away head, or a face cropped by the frame edge.
- Motion is at its peak: the apex of a jump with the subject airborne, the instant of contact, the top of a spin, the moment a gesture lands. Not the wind-up, not the landing.
- Landscapes and wide shots are level and complete, with the subject or horizon well placed and nothing important cut off.

Strictly avoid: motion blur, out-of-focus frames, frames where the camera is whipping or shaking, subjects cut in half by the frame edge, transitions between shots, and frames that are almost black or blown out.

Every moment must last 0.5 to 3 seconds, fall between 0 and ${duration.toFixed(1)}, and not overlap substantially with another.

${manifest}.

Return ONLY valid JSON in this shape: {"highlights":[{"start":number,"end":number,"peakTime":number,"title":string}]}. peakTime must sit inside [start,end] and mark the single sharpest, most expressive instant to freeze-frame — be precise, it is used to pick the exact still. Write title in ${language}, maximum 4 words.`,
          },
          ...frames.map((frame) => ({ type: "input_image" as const, image_url: frame.image, detail: "low" as const })),
        ],
      }],
      max_output_tokens: 700,
    });

    const highlights = parseHighlights(response.output_text, duration, locale);
    if (!highlights) {
      return NextResponse.json({ error: "unparseable" }, { status: 502 });
    }
    return NextResponse.json({ highlights });
  } catch (error) {
    logServerError("analyze:request", error);
    return NextResponse.json({ error: "upstream-failed" }, { status: 502 });
  }
}
