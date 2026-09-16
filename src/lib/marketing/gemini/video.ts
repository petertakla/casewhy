// Round 91 — video generation: several Veo clips + TTS narration +
// burned-in captions, stitched with ffmpeg into one ≤60s 9:16 MP4.
// Confirmed live before writing this file: a real Veo call
// (google/veo-3.1-lite-generate-001, 4s, 720p, no audio) returned a real
// playable MP4 in ~21s, and a real TTS call (openai/tts-1) returned real
// narration audio -- both through the existing Vercel AI Gateway
// credentials, no separate key.
//
// video_script format (this pipeline's own convention, since the task
// doc leaves the exact shape to Code): scenes separated by a line
// containing only "---", each scene three lines:
//   SCENE: <visual description Veo generates from>
//   CAPTION: <on-screen text, burned in>
//   VOICEOVER: <narration text for this scene, read by TTS>
// 4-6 scenes at ~8s each keeps the final video inside the 30-45s target
// the task doc names and the ≤60s hard cap.

import { experimental_generateVideo, experimental_generateSpeech } from "ai";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import {
  GEMINI_VIDEO_MODEL,
  VEO_CLIP_DURATION_SECONDS,
  VEO_CLIP_RESOLUTION,
  VEO_GENERATE_AUDIO,
  TTS_MODEL,
} from "./config";

const execFileAsync = promisify(execFile);

interface Scene {
  visual: string;
  caption: string;
  voiceover: string;
}

export function parseVideoScript(videoScript: string): Scene[] {
  const blocks = videoScript.split(/\n-{3,}\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const visual = /SCENE:\s*(.+)/.exec(block)?.[1]?.trim() ?? "";
    const caption = /CAPTION:\s*(.+)/.exec(block)?.[1]?.trim() ?? "";
    const voiceover = /VOICEOVER:\s*(.+)/.exec(block)?.[1]?.trim() ?? "";
    if (!visual) throw new Error(`video_script block missing SCENE: line: ${block.slice(0, 60)}`);
    return { visual, caption, voiceover };
  });
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapCaption(text: string, maxCharsPerLine = 24): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// The ffmpeg-static npm binary reports --enable-libfreetype in its own
// configure string but doesn't actually register the drawtext filter
// (confirmed live: "No such filter: 'drawtext'" -- a real, disclosed
// limitation of that specific static build, not a bug in this code).
// Captions are rendered as a transparent PNG via sharp (already a real,
// working dependency) instead, then composited with ffmpeg's overlay
// filter, which has no font/filter-availability dependency at all.
async function renderCaptionPng(caption: string): Promise<Buffer> {
  const lines = wrapCaption(caption);
  const lineHeight = 68;
  const fontSize = 54;
  const boxHeight = lines.length * lineHeight + 60;
  const boxTop = 1920 - 260 - boxHeight;
  const textLines = lines
    .map((line, i) => {
      const y = boxTop + 42 + i * lineHeight + fontSize * 0.8;
      return `<text x="540" y="${y}" font-family="Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#ffffff" text-anchor="middle">${escapeXml(line)}</text>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
    <rect x="60" y="${boxTop}" width="960" height="${boxHeight}" rx="18" fill="#000000" fill-opacity="0.55"/>
    ${textLines}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export interface GeneratedVideo {
  buffer: Buffer;
  durationSeconds: number;
  estimatedCostUsd: number;
}

export async function generateVideo(params: { videoScript: string; locale: string }): Promise<GeneratedVideo> {
  const scenes = parseVideoScript(params.videoScript);
  if (scenes.length === 0) throw new Error("video_script produced zero scenes.");

  const workDir = await mkdtemp(join(tmpdir(), "casewhy-video-"));
  try {
    let estimatedCostUsd = 0;

    // 1. One Veo clip per scene, in parallel -- each call is independent.
    const clipPaths = await Promise.all(
      scenes.map(async (scene, i) => {
        const result = await experimental_generateVideo({
          model: GEMINI_VIDEO_MODEL,
          prompt: `${scene.visual} Vertical video, no on-screen text, no logos, no real people depicted, no USCIS seal or government emblem.`,
          aspectRatio: "9:16",
          resolution: VEO_CLIP_RESOLUTION,
          duration: VEO_CLIP_DURATION_SECONDS,
          generateAudio: VEO_GENERATE_AUDIO,
        });
        const video = result.videos?.[0];
        if (!video) throw new Error(`Veo returned no video for scene ${i}.`);
        const buf = video.base64 ? Buffer.from(video.base64, "base64") : Buffer.from(video.uint8Array);
        const path = join(workDir, `clip-${i}.mp4`);
        await writeFile(path, buf);
        return path;
      })
    );
    estimatedCostUsd += scenes.length * VEO_CLIP_DURATION_SECONDS * 0.05;

    // 2. One TTS call per scene with narration text, silence for scenes
    // with none (a pure-visual beat) -- ffmpeg's anullsrc fills the gap
    // so the final concatenated audio track stays in sync with the video.
    const audioPaths = await Promise.all(
      scenes.map(async (scene, i) => {
        const path = join(workDir, `audio-${i}.mp3`);
        if (!scene.voiceover.trim()) {
          await execFileAsync(ffmpegPath as string, [
            "-y",
            "-f",
            "lavfi",
            "-i",
            `anullsrc=r=24000:cl=mono`,
            "-t",
            String(VEO_CLIP_DURATION_SECONDS),
            path,
          ]);
          return path;
        }
        const result = await experimental_generateSpeech({ model: TTS_MODEL, text: scene.voiceover });
        const buf = result.audio.base64 ? Buffer.from(result.audio.base64, "base64") : Buffer.from(result.audio.uint8Array);
        await writeFile(path, buf);
        return path;
      })
    );
    const totalVoiceoverChars = scenes.reduce((sum, s) => sum + s.voiceover.length, 0);
    estimatedCostUsd += (totalVoiceoverChars / 1000) * 0.015;

    // 3. Per-scene: overlay the caption PNG onto the clip, mux in that
    // scene's narration. Real bug caught by inspecting the first render's
    // actual duration (22.6s instead of the expected 32s for 4x8s
    // scenes): "-shortest" trims the OUTPUT to the shortest input
    // stream, and a short VOICEOVER line is often under 8s -- it was
    // truncating each Veo clip's own video to match a short narration
    // instead of padding the narration to match the clip. Fixed: "apad"
    // pads audio with silence to fill the gap, and an explicit "-t"
    // (the clip's real duration) replaces "-shortest" on the output.
    const composedPaths = await Promise.all(
      scenes.map(async (scene, i) => {
        const outPath = join(workDir, `composed-${i}.mp4`);
        if (scene.caption) {
          const captionPath = join(workDir, `caption-${i}.png`);
          await writeFile(captionPath, await renderCaptionPng(scene.caption));
          await execFileAsync(ffmpegPath as string, [
            "-y",
            "-i",
            clipPaths[i],
            "-i",
            audioPaths[i],
            "-loop",
            "1",
            "-i",
            captionPath,
            "-filter_complex",
            "[0:v]scale=1080:1920[bg];[bg][2:v]overlay=0:0[v];[1:a]apad[a]",
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-t",
            String(VEO_CLIP_DURATION_SECONDS),
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            outPath,
          ]);
        } else {
          await execFileAsync(ffmpegPath as string, [
            "-y",
            "-i",
            clipPaths[i],
            "-i",
            audioPaths[i],
            "-filter_complex",
            "[0:v]scale=1080:1920[v];[1:a]apad[a]",
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-t",
            String(VEO_CLIP_DURATION_SECONDS),
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            outPath,
          ]);
        }
        return outPath;
      })
    );

    // 4. Concat demuxer -- all clips already share codec/resolution from
    // step 3, so a stream-copy concat is safe and fast.
    const listPath = join(workDir, "concat.txt");
    await writeFile(listPath, composedPaths.map((p) => `file '${p}'`).join("\n"));
    const finalPath = join(workDir, "final.mp4");
    await execFileAsync(ffmpegPath as string, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c",
      "copy",
      finalPath,
    ]);

    const buffer = await readFile(finalPath);
    return { buffer, durationSeconds: scenes.length * VEO_CLIP_DURATION_SECONDS, estimatedCostUsd };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
