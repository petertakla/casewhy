// Round 91 — weekly cron: renders the next due content_briefs row per
// format (pin, short_video, square_graphic, story), uploads the asset,
// and creates a marketing_queue item per target channel. Same bearer-
// secured pattern as every other /api/cron/* route (isAuthorizedCronRequest).
//
// Video generation is the slow path here (several parallel Veo calls,
// each observed taking ~20s for a 4s clip in this round's live test --
// an 8s 1080p clip will run longer). maxDuration is set generously; if a
// real run ever needs more, Vercel Functions' default ceiling is 300s
// (per this project's own Vercel-plugin session notes), well above what
// a single week's one-video-plus-images run should need.

import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { renderDueBriefs } from "@/lib/marketing/gemini/render-brief";

export const maxDuration = 280;

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await renderDueBriefs();
  return NextResponse.json({ results });
}
