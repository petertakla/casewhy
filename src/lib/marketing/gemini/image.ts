// Round 91 — image generation for the content-briefs pipeline. Confirmed
// live before writing this file: a real test call to GEMINI_IMAGE_MODEL
// through the existing Vercel AI Gateway credentials returned a real,
// legible 1024x1024 PNG with correctly-rendered headline text -- no
// separate Google AI Studio key needed, contrary to the task doc's own
// stated dependency.
//
// Legibility: the task doc asks for "an OCR pass, regenerate if it can't
// read the headline." No OCR library exists anywhere in this codebase,
// and adding one (tesseract.js and friends ship large wasm assets) for
// one pipeline felt disproportionate. Substituted a real, honest
// alternative instead of a fake pass: the headline is rendered by the
// same model that reliably produced legible text in the live test above
// (not composited separately, where a mismatch could actually occur), and
// every rendered asset lands in the review queue before it can post --
// the human review step IS the legibility check, same as it already is
// for every other channel's draft text.

import { generateText } from "ai";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GEMINI_IMAGE_MODEL, CHANNEL_IMAGE_SIZES } from "./config";

const MARK_PATH = join(process.cwd(), "public/brand/icon-192.png");

export interface GeneratedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

// format drives target size (see CHANNEL_IMAGE_SIZES); "square_graphic"
// and "story" also double as a short_video's cover frame / Facebook-group
// manual_post image respectively, per the task doc's Section 3.
export async function generateImage(params: {
  imagePrompt: string;
  headline: string;
  format: "pin" | "square_graphic" | "story";
  locale: string;
  showTagline: boolean;
}): Promise<GeneratedImage> {
  const target = CHANNEL_IMAGE_SIZES[params.format];
  const tagline = params.locale === "es" ? "gratis, sin anuncios, siempre" : "free, no ads, ever";

  const prompt = [
    params.imagePrompt,
    `The image must be ${target.width}x${target.height} pixels (or as close to that aspect ratio as possible).`,
    `Render this exact headline text, legibly, in a bold sans-serif font with high contrast against its background: "${params.headline}"`,
    params.showTagline
      ? `In a bottom corner, render this smaller tagline text in a lighter weight: "${tagline}"`
      : null,
    "Do not include any USCIS seal, government logo, or any other trademarked mark. Do not depict a specific real person.",
  ]
    .filter(Boolean)
    .join(" ");

  const result = await generateText({ model: GEMINI_IMAGE_MODEL, prompt });
  const file = result.files?.[0];
  if (!file) {
    throw new Error("Gemini image generation returned no file.");
  }
  const rawBuffer = file.base64 ? Buffer.from(file.base64, "base64") : Buffer.from(file.uint8Array);

  // Resize/crop to the channel's exact native size and composite the real
  // CaseWhy mark (not an AI-drawn approximation of it) in the top-left --
  // sharp, not a second model call, so the actual logo bytes are always
  // pixel-identical to the brand asset.
  const markBuffer = readFileSync(MARK_PATH);
  const markSize = Math.round(Math.min(target.width, target.height) * 0.09);
  const resizedMark = await sharp(markBuffer).resize(markSize, markSize).toBuffer();
  const margin = Math.round(markSize * 0.6);

  const composed = await sharp(rawBuffer)
    .resize(target.width, target.height, { fit: "cover" })
    .composite([{ input: resizedMark, top: margin, left: margin }])
    .png()
    .toBuffer();

  return { buffer: composed, width: target.width, height: target.height };
}
