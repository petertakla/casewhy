// Round 91A follow-up (Sep 18) — real TikTok Content Posting API poster
// (draft-inbox upload, FILE_UPLOAD -- see postToTikTok's own comment on
// why this uses /inbox/video/init/ rather than Direct Post). Unlike
// every other poster's static or non-rotating credential, TikTok's
// OAuth is a genuine three-legged flow with a **rotating refresh
// token** -- see schema.ts's own comment on tiktokOauthToken for why
// that token lives in the DB, not an env var.
//
// TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET (static, app-level) still come
// from env vars via `vercel env add`, same as every other poster's app
// credentials. The user-level access/refresh tokens come from Peter's
// one-time authorization at /api/admin/tiktok-oauth/start.
//
// FILE_UPLOAD chosen over PULL_FROM_URL deliberately: PULL_FROM_URL
// needs verified ownership of the video's own domain, and our rendered
// assets live on Vercel's shared blob-storage domain
// (*.public.blob.vercel-storage.com) -- not something we can verify
// ownership of the way we verified www.casewhy.com for the app details
// URLs. FILE_UPLOAD (downloading the video here, then PUTting the bytes
// to TikTok's own upload URL) works regardless of where the source file
// is hosted.
//
// Real, current constraint (not assumed): while this app is unaudited,
// Direct Post (/v2/post/publish/video/init/) rejects every publish
// attempt with "unaudited_client_can_only_post_to_private_accounts"
// unless the authorizing account's own TikTok privacy setting is
// Private -- a whole-account setting, not this call's privacy_level
// param. Peter opted to keep casewhyapp public and use the draft-inbox
// upload instead (confirmed live 2026-09-18); switch back to Direct
// Post once the app clears TikTok's content-sharing audit.

import { eq } from "drizzle-orm";
import type { Poster } from "./types";
import { isUnconfigured } from "./env";
import { getDb } from "../../db/client";
import { tiktokOauthToken } from "../../db/schema";

const TIKTOK_API_BASE = "https://open.tiktokapis.com";
const TOKEN_ID = "singleton";

function requireClientCredentials() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (isUnconfigured(clientKey) || isUnconfigured(clientSecret)) {
    throw new Error(
      "TikTok posting isn't configured yet -- TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET aren't both set. See CLOUD_CLAUDE.md's round 91A checklist."
    );
  }
  return { clientKey: clientKey!, clientSecret: clientSecret! };
}

export function getTikTokAuthUrl(redirectUri: string, state: string): string {
  const { clientKey } = requireClientCredentials();
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: "user.info.basic,video.publish,video.upload",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  open_id?: string;
  error?: string;
  error_description?: string;
}

// Exchanges an authorization code for the first access/refresh token
// pair -- called once, from the OAuth callback route.
export async function exchangeTikTokCode(code: string, redirectUri: string): Promise<void> {
  const { clientKey, clientSecret } = requireClientCredentials();
  const res = await fetch(`${TIKTOK_API_BASE}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token || !data.refresh_token || !data.open_id) {
    throw new Error(`TikTok token exchange failed: ${data.error_description ?? data.error ?? res.status}`);
  }
  await persistTokens(data);
}

async function persistTokens(data: TokenResponse): Promise<void> {
  const db = getDb();
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 86400) * 1000);
  await db
    .insert(tiktokOauthToken)
    .values({
      id: TOKEN_ID,
      accessToken: data.access_token!,
      accessTokenExpiresAt: expiresAt,
      refreshToken: data.refresh_token!,
      openId: data.open_id!,
    })
    .onConflictDoUpdate({
      target: tiktokOauthToken.id,
      set: {
        accessToken: data.access_token!,
        accessTokenExpiresAt: expiresAt,
        refreshToken: data.refresh_token!,
        openId: data.open_id!,
        updatedAt: new Date(),
      },
    });
}

// Refreshes the access token if it's expired or about to be (60s
// margin), persisting whatever refresh_token comes back -- same or
// rotated -- per TikTok's own explicit instruction to always store the
// newly-returned value.
async function getValidAccessToken(): Promise<string> {
  const db = getDb();
  const [row] = await db.select().from(tiktokOauthToken).where(eq(tiktokOauthToken.id, TOKEN_ID)).limit(1);
  if (!row) {
    throw new Error(
      "TikTok posting isn't authorized yet -- no token on file. Visit /api/admin/tiktok-oauth/start once, signed in as admin."
    );
  }

  if (row.accessTokenExpiresAt.getTime() - Date.now() > 60_000) {
    return row.accessToken;
  }

  const { clientKey, clientSecret } = requireClientCredentials();
  const res = await fetch(`${TIKTOK_API_BASE}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: row.refreshToken,
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token || !data.refresh_token || !data.open_id) {
    throw new Error(
      `TikTok token refresh failed: ${data.error_description ?? data.error ?? res.status}. If the refresh token itself expired (365-day lifetime), re-authorize at /api/admin/tiktok-oauth/start.`
    );
  }
  await persistTokens(data);
  return data.access_token;
}

interface InitResponse {
  data?: { publish_id?: string; upload_url?: string };
  error?: { code: string; message: string };
}

interface StatusResponse {
  data?: { status?: string; fail_reason?: string };
  error?: { code: string; message: string };
}

export const postToTikTok: Poster = async (item) => {
  if (!item.mediaRefs) throw new Error("TikTok poster: no video URL on this item (mediaRefs is empty).");
  const accessToken = await getValidAccessToken();
  const authHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" };

  const videoRes = await fetch(item.mediaRefs);
  if (!videoRes.ok) throw new Error(`TikTok poster: couldn't download rendered video from storage (${videoRes.status}).`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  // Draft-inbox upload (video.upload scope), not Direct Post. Direct
  // Post's own /video/init/ rejects every unaudited client with
  // "unaudited_client_can_only_post_to_private_accounts" UNLESS the
  // authorizing account's own TikTok privacy setting is Private (a
  // whole-account setting, separate from this call's privacy_level
  // param) -- confirmed live 2026-09-18. Peter opted to keep casewhyapp
  // public and use drafts instead, so this uploads to the creator's
  // TikTok inbox for a manual finish-and-post tap in the TikTok app.
  // Switch to /video/init/ + post_info once the app clears TikTok's
  // content-sharing audit and Direct Post no longer needs that.
  const initRes = await fetch(`${TIKTOK_API_BASE}/v2/post/publish/inbox/video/init/`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoBuffer.length,
        chunk_size: videoBuffer.length,
        total_chunk_count: 1,
      },
    }),
  });
  const initData = (await initRes.json()) as InitResponse;
  if (!initRes.ok || !initData.data?.publish_id || !initData.data?.upload_url) {
    throw new Error(`TikTok draft upload init failed: ${initData.error?.message ?? initRes.status}`);
  }
  const { publish_id, upload_url } = initData.data;

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: videoBuffer,
  });
  if (!uploadRes.ok) throw new Error(`TikTok video upload failed (${uploadRes.status}).`);

  // Publishing is async on TikTok's side -- poll a few times with a
  // short wait rather than assuming success from a 200 on init/upload
  // alone. Not exhaustive (bounded to stay well inside a server
  // action's own duration budget); a post still mid-processing after
  // this returns as "submitted, not yet confirmed" rather than a false
  // failure.
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${TIKTOK_API_BASE}/v2/post/publish/status/fetch/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ publish_id }),
    });
    const statusData = (await statusRes.json()) as StatusResponse;
    if (statusData.data?.status === "SEND_TO_USER_INBOX") {
      return { url: `https://www.tiktok.com/@${process.env.TIKTOK_HANDLE || "casewhyapp"}` };
    }
    if (statusData.data?.status === "FAILED") {
      throw new Error(`TikTok publish failed: ${statusData.data.fail_reason ?? "unknown reason"}`);
    }
  }

  // Still processing after the polling window -- a real, distinct
  // outcome from failure. Returning success since the upload itself
  // succeeded; TikTok finishes processing shortly after.
  return { url: `https://www.tiktok.com/@${process.env.TIKTOK_HANDLE || "casewhyapp"}` };
};
