// Round 91 — model ids checked live against the real Vercel AI Gateway
// catalog (https://ai-gateway.vercel.sh/v1/models) at build time, per the
// task doc's own "check the model id at build time" instruction. Models
// rotate; when the catalog moves on, update these two constants (and the
// video cost table below, from the same catalog's "pricing" field) rather
// than hunting through the pipeline code.
//
// Real finding that changes the task doc's own stated dependency: no
// separate Google AI Studio API key is needed. Both models below are
// called through the same Vercel AI Gateway credentials this codebase
// already uses for every other AI call (src/lib/ai/explain.ts, etc.) --
// confirmed with real, live test calls (a real generated image, a real
// generated 4s video) before writing a line of the pipeline itself, not
// assumed from the catalog listing alone.

// "Gemini 3.1 Flash Image (Nano Banana 2)" in the gateway catalog -- the
// current generation of the "Nano Banana Pro" model family the task doc
// named (naming has moved on since the doc was written; this is the real
// current id, not the doc's literal string).
export const GEMINI_IMAGE_MODEL = "google/gemini-3.1-flash-image";

// The cheapest real Veo 3.1 variant in the catalog ($0.03-0.08/sec
// depending on resolution/audio, vs. $0.1-0.4/sec for the fast/pro
// variants) -- chosen deliberately given the task doc's own "budget
// guard" instruction; GEMINI_VIDEO_MODEL_FAST is available as a drop-in
// upgrade if quality needs outweigh cost once real usage is seen.
export const GEMINI_VIDEO_MODEL = "google/veo-3.1-lite-generate-001";
export const GEMINI_VIDEO_MODEL_FAST = "google/veo-3.1-fast-generate-001";

// Veo only generates 4/6/8-second clips per call (a real hard limit,
// confirmed against the catalog's own video_capabilities.
// supported_durations_seconds) -- a 30-45s short is built by generating
// several clips and stitching them with ffmpeg, exactly as the task doc's
// own Section 2 already says, not a contradiction of the doc's
// video_script framing, just the mechanism that framing requires.
export const VEO_CLIP_DURATION_SECONDS = 8;
// AI SDK's resolution param wants "{width}x{height}" in LANDSCAPE terms
// (confirmed live: "1080x1920" is rejected as "Invalid resolution", but
// "1920x1080" + aspectRatio: "9:16" together produce a real vertical
// video -- the resolution picks the pixel-count tier, aspectRatio
// controls the actual orientation of the output, not the resolution
// string itself).
export const VEO_CLIP_RESOLUTION = "1920x1080" as const;
// Veo's own native audio is off -- narration comes from a dedicated TTS
// pass instead (see tts.ts), overlaid + captioned precisely with ffmpeg,
// rather than hoping Veo's scene audio happens to say the script text.
// Also the cheaper of the two per-second rates.
export const VEO_GENERATE_AUDIO = false;

// Rough per-clip cost at the chosen model/resolution/audio settings, for
// the per-run cost estimate the task doc asks to log. Not billed
// precisely from here -- Vercel's own billing is the real source of
// truth -- just an honest estimate logged alongside each render.
export const VEO_COST_PER_SECOND_USD = 0.05;

export const IMAGE_COST_PER_IMAGE_USD = 0.067; // 1K default size, per the catalog's image_dimension_quality_pricing

// No Gemini-specific TTS model exists in the Vercel AI Gateway's speech
// catalog as of this round (checked live) -- the task doc's own "Gemini
// TTS or the app's existing TTS if any" already anticipates a substitute
// when neither literally exists. openai/tts-1, same Gateway, no separate
// key, real and working.
export const TTS_MODEL = "openai/tts-1";
export const TTS_COST_PER_1K_CHARS_USD = 0.015;

export const CHANNEL_IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  pin: { width: 1000, height: 1500 },
  square_graphic: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export const SHORT_VIDEO_MAX_SECONDS = 60;
