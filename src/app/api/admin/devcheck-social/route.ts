// TEMPORARY, Sep 18 -- Peter asked to re-verify X/Threads/Pinterest/
// YouTube are genuinely posting for real, not just "code exists and
// typechecks." Local testing can't do this: `vercel env pull` can't
// retrieve Secret-type values, so local .env.local holds the literal
// "[SENSITIVE]" placeholder for these, not real credentials -- this
// route runs the real posters against real Production secrets, in
// Production, the only place they actually exist. Delete once resolved.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { postToX } from "@/lib/marketing/posters/x";
import { postToThreads } from "@/lib/marketing/posters/threads";
import { postToPinterest } from "@/lib/marketing/posters/pinterest";
import { postToYoutube } from "@/lib/marketing/posters/youtube";

const TEST_VIDEO_URL =
  "https://p76r9qriuhqpxpyx.public.blob.vercel-storage.com/marketing/delays-and-escalation/2026-09-16/9e443abc-d95f-42a2-8835-2a1a53dfe420-video.mp4";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { channel } = (await request.json()) as { channel?: string };

  try {
    if (channel === "x") {
      const result = await postToX({
        channel: "x",
        draftText: "Verification test post -- confirming CaseWhy's X integration is live. Deleting shortly.",
        mediaRefs: null,
        destination: "new post",
      });
      return Response.json({ ok: true, result });
    }
    if (channel === "threads") {
      const result = await postToThreads({
        channel: "threads",
        draftText: "Verification test post -- confirming CaseWhy's Threads integration is live.",
        mediaRefs: null,
        destination: "new post",
      });
      return Response.json({ ok: true, result });
    }
    if (channel === "pinterest") {
      const result = await postToPinterest({
        channel: "pinterest",
        draftText: "Verification test pin\n\nConfirming CaseWhy's Pinterest integration is live. Deleting shortly.",
        mediaRefs:
          "https://p76r9qriuhqpxpyx.public.blob.vercel-storage.com/marketing/status-explained/2026-09-16/32dccc0e-f82a-4997-9abd-3c098631e217-pin.png",
        destination: "new post",
      });
      return Response.json({ ok: true, result });
    }
    if (channel === "youtube") {
      const result = await postToYoutube({
        channel: "youtube",
        draftText: "Verification test upload\n\nConfirming CaseWhy's YouTube integration is live.",
        mediaRefs: TEST_VIDEO_URL,
        destination: "new post",
      });
      return Response.json({ ok: true, result });
    }
    return Response.json({ error: "unknown channel" }, { status: 400 });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const names = ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID", "PINTEREST_ACCESS_TOKEN", "PINTEREST_BOARD_ID", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"];
  const shapes = names.map((name) => {
    const raw = process.env[name];
    return { name, set: Boolean(raw), isReplaceMe: raw === "REPLACE_ME", length: raw?.length ?? 0 };
  });
  return Response.json({ shapes });
}
