import OpenAI from "openai";
import { createMomentPlaceholder } from "../mevid/highlights";
import { logServerError } from "./log";
import type { Locale, VideoHighlight, VisualSource } from "../mevid/types";

const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

function imagePrompt(highlight: VideoHighlight) {
  return `Create a single premium editorial visual that represents this short social-video moment: ${highlight.visualPrompt}. Use cinematic natural lighting, a dynamic composition, and a polished contemporary aesthetic. This must be a newly generated visual interpretation, never a screenshot or frame from a video. Do not include text, subtitles, timestamps, UI, logos, watermarks, borders, or collage panels.`;
}

async function generateVisual(client: OpenAI, highlight: VideoHighlight, index: number) {
  try {
    const result = await client.images.generate({
      model: imageModel,
      prompt: imagePrompt(highlight),
      size: "1024x1024",
      quality: "low",
      output_format: "webp",
      output_compression: 80,
    });
    const image = result.data?.[0]?.b64_json;
    return image ? `data:image/webp;base64,${image}` : createMomentPlaceholder(index, highlight.title);
  } catch (error) {
    logServerError("moment-visuals:generate", error);
    return createMomentPlaceholder(index, highlight.title);
  }
}

export async function addMomentVisuals(client: OpenAI, highlights: VideoHighlight[], locale: Locale): Promise<{ highlights: VideoHighlight[]; visualSource: VisualSource }> {
  const images = await Promise.all(highlights.map((highlight, index) => generateVisual(client, highlight, index)));
  const hasGeneratedImage = images.some((image) => !image.startsWith("data:image/svg+xml"));
  return {
    highlights: highlights.map((highlight, index) => ({ ...highlight, image: images[index] })),
    visualSource: hasGeneratedImage ? "generated" : "placeholder",
  };
}
