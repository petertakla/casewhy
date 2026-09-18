// Round 91A follow-up (Sep 18) — Peter's one-time TikTok authorization
// step, same pattern as /api/admin/youtube-oauth/start. Signed in as
// admin, visiting this URL redirects to TikTok's real OAuth consent
// screen; the callback below exchanges the resulting code for tokens
// and persists them to the DB directly (no manual copy-paste of a
// refresh token into an env var -- see tiktok.ts's own comment on why
// TikTok's rotating refresh token can't live in an env var the way
// YouTube's does).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getTikTokAuthUrl } from "@/lib/marketing/posters/tiktok";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const redirectUri = new URL("/api/admin/tiktok-oauth/callback", request.url).toString();
  const state = crypto.randomUUID();
  const authUrl = getTikTokAuthUrl(redirectUri, state);
  return NextResponse.redirect(authUrl);
}
