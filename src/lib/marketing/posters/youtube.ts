// Round 91 — YouTube Data API v3 poster (videos.insert, YouTube Shorts
// via a vertical <=60s upload). Uses googleapis (already a dependency,
// used by src/lib/email-aliases/gmail-client.ts for a different Google
// API) with a stored OAuth2 refresh token -- unlike Gmail's Workspace
// service-account/domain-wide-delegation approach, a personal/brand
// YouTube channel needs a standard user-consent OAuth2 flow, done once
// via /api/admin/youtube-oauth/start (admin-gated) and never again, since
// the refresh token doesn't expire on its own.
//
// Needs Peter's own one-time setup: a Google Cloud project + OAuth client
// (console.cloud.google.com), YouTube Data API v3 enabled, then
// YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET via `vercel env add`, then
// visiting /api/admin/youtube-oauth/start once while signed in as admin
// to grant upload access and get YOUTUBE_REFRESH_TOKEN (shown on the
// callback page to copy into env). Until all three env vars exist, this
// poster throws a clear "not configured" error.

import { Readable } from "node:stream";
import { google } from "googleapis";
import type { Poster } from "./types";
import { isUnconfigured } from "./env";

function requireCredentials() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (isUnconfigured(clientId) || isUnconfigured(clientSecret) || isUnconfigured(refreshToken)) {
    throw new Error(
      "YouTube posting isn't configured yet -- YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET/YOUTUBE_REFRESH_TOKEN aren't all set. See the round 91 checklist in CLOUD_CLAUDE.md, and visit /api/admin/youtube-oauth/start once signed in as admin."
    );
  }
  return { clientId: clientId!, clientSecret: clientSecret!, refreshToken: refreshToken! };
}

export function getYoutubeOAuthClient(redirectUri: string) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (isUnconfigured(clientId) || isUnconfigured(clientSecret)) {
    throw new Error("YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET aren't set yet.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const postToYoutube: Poster = async (item) => {
  const { clientId, clientSecret, refreshToken } = requireCredentials();
  if (!item.mediaRefs) throw new Error("YouTube poster: no video URL on this item (mediaRefs is empty).");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const videoRes = await fetch(item.mediaRefs);
  if (!videoRes.ok || !videoRes.body) {
    throw new Error(`YouTube poster: couldn't download rendered video from storage (${videoRes.status}).`);
  }

  const [title, ...bodyParts] = item.draftText.split("\n\n");
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const insertRes = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description: bodyParts.join("\n\n").slice(0, 5000),
        categoryId: "27", // Education
      },
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
    },
    // fetch()'s response.body is a Web ReadableStream, but googleapis'
    // media.body needs a Node.js stream with a real .pipe() -- passing
    // the web stream directly fails with "b.body.pipe is not a function"
    // (confirmed live 2026-09-19). Readable.fromWeb bridges the two.
    media: { body: Readable.fromWeb(videoRes.body as import("stream/web").ReadableStream<Uint8Array>) },
  });

  const videoId = insertRes.data.id;
  if (!videoId) throw new Error("YouTube API returned no video id.");
  return { url: `https://youtube.com/shorts/${videoId}` };
};
