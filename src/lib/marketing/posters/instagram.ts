// Round 91A remainder (Sep 18) — real Instagram poster. Round 90/91
// parked this as a "Meta platform gap" after `instagram_business_account`
// came back empty on the Page -- that diagnosis was incomplete, not
// wrong about the symptom: the CaseWhy Page token simply never had any
// Instagram permission on it (only pages_* scopes), so of course an
// Instagram-scoped field returned nothing. Meta Business Suite's own
// "Connected assets" tab showed @casewhyapp genuinely linked to the
// Page the whole time. Confirmed live 2026-09-18: adding
// instagram_basic + instagram_content_publish to the same Page token
// (then the same 60-day fb_exchange_token exchange facebook.ts already
// documents) made `GET /{ig-user-id}` resolve for real
// (username: "casewhyapp"). Reuses FACEBOOK_PAGE_ACCESS_TOKEN -- it's
// the same underlying Page token, now carrying both scopes, not a
// separate credential.
//
// page_backed_instagram_accounts (a different, auto-generated shadow id
// tied to the Page for cross-app comments/DMs) is NOT this account and
// isn't a real, postable Instagram profile -- don't confuse the two if
// debugging this again; the real id is whatever
// INSTAGRAM_BUSINESS_ACCOUNT_ID is set to.
//
// Needs two env vars via `vercel env add`: INSTAGRAM_BUSINESS_ACCOUNT_ID
// (Config, not sensitive -- it's a public IG account id, from Meta
// Business Suite → Settings → Instagram accounts → the account's own
// "ID" field) and the existing FACEBOOK_PAGE_ACCESS_TOKEN (Sensitive,
// shared with facebook.ts).

import type { Poster } from "./types";
import { isUnconfigured } from "./env";

const GRAPH_API_BASE = "https://graph.facebook.com/v26.0";

function requireCredentials() {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (isUnconfigured(igUserId) || isUnconfigured(accessToken)) {
    throw new Error(
      "Instagram posting isn't configured yet -- INSTAGRAM_BUSINESS_ACCOUNT_ID/FACEBOOK_PAGE_ACCESS_TOKEN aren't both set. See the round 91A remainder checklist in CLOUD_CLAUDE.md."
    );
  }
  return { igUserId: igUserId!, accessToken: accessToken! };
}

// The rendered-asset filename (set by render-brief.ts's `fileName`)
// carries the format CaseWhy generated it as -- the only signal
// available here, since MarketingPostItem doesn't otherwise pass a
// format. Instagram's Content Publishing API needs a different
// media_type per format: a plain image feed post (square_graphic and
// anything else default), an Instagram Story, or a Reel (any video).
function mediaTypeFor(mediaUrl: string): "STORIES" | "REELS" | undefined {
  if (/-story\.\w+($|\?)/i.test(mediaUrl)) return "STORIES";
  if (/\.(mp4|mov)($|\?)/i.test(mediaUrl)) return "REELS";
  return undefined; // plain feed image post
}

interface ContainerResponse {
  id?: string;
  error?: { message?: string };
}

interface StatusResponse {
  status_code?: string;
  error?: { message?: string };
}

interface PublishResponse {
  id?: string;
  error?: { message?: string };
}

export const postToInstagram: Poster = async (item) => {
  const { igUserId, accessToken } = requireCredentials();
  if (!item.mediaRefs) throw new Error("Instagram poster: no media URL on this item (mediaRefs is empty).");

  const caption = item.draftText.trim().slice(0, 2200);
  const mediaType = mediaTypeFor(item.mediaRefs);
  const isVideo = mediaType === "REELS";

  const containerBody: Record<string, string> = {
    caption,
    access_token: accessToken,
    ...(isVideo ? { video_url: item.mediaRefs } : { image_url: item.mediaRefs }),
    ...(mediaType ? { media_type: mediaType } : {}),
  };

  const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });
  const containerData = (await containerRes.json()) as ContainerResponse;
  if (!containerRes.ok || !containerData.id) {
    throw new Error(`Instagram media container failed (${containerRes.status}): ${containerData.error?.message ?? "unknown"}`);
  }
  const containerId = containerData.id;

  // Every container -- image or video -- processes asynchronously on
  // Meta's side; publishing before status_code is FINISHED fails with
  // "Media ID is not available" (confirmed live 2026-09-18, an image
  // container took ~2s). Images are usually much faster than Reels, but
  // never instant -- always poll, never skip.
  let ready = false;
  for (let attempt = 0; attempt < 10 && !ready; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(`${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`);
    const statusData = (await statusRes.json()) as StatusResponse;
    if (statusData.status_code === "FINISHED") {
      ready = true;
    } else if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram media container failed to process: ${statusData.error?.message ?? "unknown"}`);
    }
  }
  if (!ready) throw new Error("Instagram media container still processing after the polling window -- try again shortly.");

  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
  });
  const publishData = (await publishRes.json()) as PublishResponse;
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Instagram publish failed (${publishRes.status}): ${publishData.error?.message ?? "unknown"}`);
  }

  return { url: `https://www.instagram.com/p/${publishData.id}/` };
};
