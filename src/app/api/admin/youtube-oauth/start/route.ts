// Round 91 — Peter's one-time YouTube authorization step. Signed in as
// admin, visiting this URL redirects to Google's real OAuth consent
// screen for the youtube.upload scope; the callback below exchanges the
// resulting code for a refresh token and displays it once to copy into
// YOUTUBE_REFRESH_TOKEN.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getYoutubeOAuthClient } from "@/lib/marketing/posters/youtube";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const redirectUri = new URL("/api/admin/youtube-oauth/callback", request.url).toString();
  const oauth2Client = getYoutubeOAuthClient(redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh token even if this Google account has authorized this app before
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });

  return NextResponse.redirect(authUrl);
}
