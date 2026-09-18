// Round 91A follow-up (Sep 18) — the other half of
// /api/admin/tiktok-oauth/start. Exchanges the OAuth code for tokens and
// persists them straight to the DB (tiktokOauthToken) -- unlike YouTube's
// callback, there's no refresh token to show Peter for manual copy-paste,
// since this one rotates on its own and needs to live somewhere the
// poster itself can write to.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { exchangeTikTokCode } from "@/lib/marketing/posters/tiktok";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return new NextResponse(`TikTok authorization was denied or failed: ${error}`, { status: 400 });
  }
  if (!code) {
    return new NextResponse("No authorization code returned by TikTok.", { status: 400 });
  }

  const redirectUri = new URL("/api/admin/tiktok-oauth/callback", request.url).toString();
  try {
    await exchangeTikTokCode(code, redirectUri);
  } catch (err) {
    return new NextResponse(`Token exchange failed: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:monospace;max-width:700px;margin:40px auto;line-height:1.6">
      <h2>TikTok authorized</h2>
      <p>Nothing else to do -- the access and refresh tokens are saved. TikTok posting should work now (while this app is unaudited, posts land private-only, visible only to this account).</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
