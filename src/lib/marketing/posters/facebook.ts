// Round 90 kickoff follow-up (Sep 18) — real Facebook Page poster. The
// Page exists (facebook.com/casewhyapp) as a Meta "Profile Plus" business
// profile, not a classic personally-owned Page -- confirmed live this
// round: it never appears via the classic `me/accounts` Graph API edge,
// only through its owning Business Portfolio's `owned_pages` edge
// (`{business_id}/owned_pages`), which is also the only route that
// yields a real Page Access Token for it. Posting itself is a plain,
// well-supported Graph API call once that token is in hand -- this
// Profile-Plus distinction only affected *discovering* the Page/token,
// confirmed live by getting `owned_pages` to return a working token and
// using it successfully against this same Page id.
//
// This is the "facebook" channel's auto_post path. The SAME channel
// value is also used for Facebook *group* posts, which stay manual_post
// per SOCIAL_MEDIA_GUARDRAILS.md Section 0 (Peter pastes those himself,
// as the Page) -- this poster is only ever invoked when a row's own
// `mode` is "auto_post" (approveForAutoPost's own dispatch), so group
// rows are untouched by this file existing.
//
// Needs two env vars via `vercel env add`: FACEBOOK_PAGE_ID (Config, not
// sensitive -- it's a public Page id) and FACEBOOK_PAGE_ACCESS_TOKEN
// (Sensitive). Until both exist, throws a clear "not configured" error,
// same pattern as every other poster in this directory.
//
// Known follow-up, not done this round: the Page Access Token obtained
// live today came from a short-lived User Access Token (Graph API
// Explorer's default "Generate Access Token", not a 60-day exchange),
// so it will expire on Meta's normal short-lived schedule. A Page token
// derived from a long-lived (60-day) User Token effectively never
// expires -- doing that exchange needs the app's Client Secret, which
// Meta gates behind Peter's own password re-entry (a real, one-time
// prohibited-for-Code action, same category as any password entry).
// Peter should do that exchange himself when convenient; until then this
// token may need periodic manual refresh via the same Graph API Explorer
// flow used to obtain it today.

import type { Poster } from "./types";
import { isUnconfigured } from "./env";

const GRAPH_API_BASE = "https://graph.facebook.com/v26.0";

function requireCredentials() {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (isUnconfigured(pageId) || isUnconfigured(accessToken)) {
    throw new Error(
      "Facebook Page posting isn't configured yet -- FACEBOOK_PAGE_ID/FACEBOOK_PAGE_ACCESS_TOKEN aren't both set. See the round 90 checklist in CLOUD_CLAUDE.md."
    );
  }
  return { pageId: pageId!, accessToken: accessToken! };
}

export const postToFacebookPage: Poster = async (item) => {
  const { pageId, accessToken } = requireCredentials();
  const message = item.draftText.trim();
  if (!message) throw new Error("Facebook poster: empty draft, nothing to post.");

  // A media-carrying post uses the /photos edge (the image itself is the
  // post, message becomes its caption) -- the same real distinction
  // pinterest.ts's own poster makes for an image vs. text-only item.
  const endpoint = item.mediaRefs ? `${GRAPH_API_BASE}/${pageId}/photos` : `${GRAPH_API_BASE}/${pageId}/feed`;
  const body = item.mediaRefs ? { url: item.mediaRefs, caption: message, access_token: accessToken } : { message, access_token: accessToken };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { id?: string; post_id?: string; error?: { message?: string } };
  const postId = data.post_id ?? data.id;
  if (!res.ok || !postId) {
    throw new Error(`Facebook API error (${res.status}): ${data.error?.message ?? "unknown"}`);
  }
  return { url: `https://www.facebook.com/${postId}` };
};
