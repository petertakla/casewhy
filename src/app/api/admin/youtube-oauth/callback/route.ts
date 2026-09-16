// Round 91 — the other half of /api/admin/youtube-oauth/start. Exchanges
// the OAuth code for tokens and shows the refresh token once, in a plain
// admin-only HTML response -- never logged, never stored server-side (this
// app has nowhere it should live except the YOUTUBE_REFRESH_TOKEN env var
// Peter sets himself via `vercel env add`).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getYoutubeOAuthClient } from "@/lib/marketing/posters/youtube";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return new NextResponse("No authorization code returned by Google.", { status: 400 });
  }

  const redirectUri = new URL("/api/admin/youtube-oauth/callback", request.url).toString();
  const oauth2Client = getYoutubeOAuthClient(redirectUri);

  let refreshToken: string | null | undefined;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    refreshToken = tokens.refresh_token;
  } catch (err) {
    return new NextResponse(`Token exchange failed: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }

  if (!refreshToken) {
    return new NextResponse(
      "Google didn't return a refresh token (this usually means the CaseWhy account already granted this app access once before). Revoke access at https://myaccount.google.com/permissions and try /api/admin/youtube-oauth/start again.",
      { status: 400 }
    );
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:monospace;max-width:700px;margin:40px auto;line-height:1.6">
      <h2>YouTube authorized</h2>
      <p>Set this as an env var, then delete this refresh token from your clipboard history:</p>
      <pre style="background:#f0f0f0;padding:16px;border-radius:8px;overflow-wrap:break-word;white-space:pre-wrap">${refreshToken}</pre>
      <p>Run: <code>vercel env add YOUTUBE_REFRESH_TOKEN</code> and paste the value above.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
