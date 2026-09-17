// Round 90 — real Threads API poster (Meta's Graph API for Threads, not
// the general Instagram Graph API, though it's the same underlying OAuth2
// app). Threads posting is a real two-step create-then-publish flow, not
// one call: create a "media container" for the text, then publish that
// container -- per Meta's own documented pattern (the same shape their
// Instagram content-publishing API uses).
//
// Needs Peter's own one-time setup, same identity/authorization category
// as the X poster's own note: a Meta developer app with the CaseWhy
// Threads/Instagram account linked, producing a long-lived access token
// and the Threads user id -- two env vars, THREADS_ACCESS_TOKEN and
// THREADS_USER_ID, set via `vercel env add`. Until both exist, this poster
// throws a clear "not configured" error (same pattern as x.ts) rather than
// a confusing API failure.

import type { Poster } from "./types";
import { isUnconfigured } from "./env";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

function requireCredentials() {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (isUnconfigured(accessToken) || isUnconfigured(userId)) {
    throw new Error(
      "Threads posting isn't configured yet -- THREADS_ACCESS_TOKEN/THREADS_USER_ID aren't both set. See the round 90 checklist in CLOUD_CLAUDE.md for the one-time Meta app setup."
    );
  }
  return { accessToken: accessToken!, userId: userId! };
}

export const postToThreads: Poster = async (item) => {
  const { accessToken, userId } = requireCredentials();
  const text = item.draftText.trim();
  if (!text) throw new Error("Threads poster: empty draft, nothing to post.");

  const createRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads?media_type=TEXT&text=${encodeURIComponent(text)}&access_token=${encodeURIComponent(accessToken)}`,
    { method: "POST" }
  );
  const createData = (await createRes.json()) as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !createData.id) {
    throw new Error(`Threads API error creating container (${createRes.status}): ${createData.error?.message ?? "unknown"}`);
  }

  const publishRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_publish?creation_id=${encodeURIComponent(createData.id)}&access_token=${encodeURIComponent(accessToken)}`,
    { method: "POST" }
  );
  const publishData = (await publishRes.json()) as { id?: string; error?: { message?: string } };
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Threads API error publishing (${publishRes.status}): ${publishData.error?.message ?? "unknown"}`);
  }

  const handle = process.env.THREADS_HANDLE || "casewhy";
  return { url: `https://www.threads.net/@${handle}/post/${publishData.id}` };
};
