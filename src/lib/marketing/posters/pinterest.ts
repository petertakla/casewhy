// Round 91 — Pinterest API v5 poster. A trial-access Pinterest app issues
// a long-lived access token directly from its developer portal (no
// interactive redirect flow needed to keep alive server-side, unlike
// Google's short-lived access tokens) -- so this poster, like X's, just
// reads a pre-obtained token from env rather than needing its own OAuth
// start/callback pair the way youtube.ts does.
//
// Needs Peter's own one-time setup: a Pinterest business account + app
// (developers.pinterest.com), trial access is enough for a handful of
// pins/week, then two env vars via `vercel env add`: PINTEREST_ACCESS_TOKEN,
// PINTEREST_BOARD_ID (the destination board's id, from the board's own
// URL or the API's boards list endpoint). Until both exist, this poster
// throws a clear "not configured" error -- same pattern as X/Threads.

import type { Poster } from "./types";
import { isUnconfigured } from "./env";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

function requireCredentials() {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (isUnconfigured(accessToken) || isUnconfigured(boardId)) {
    throw new Error(
      "Pinterest posting isn't configured yet -- PINTEREST_ACCESS_TOKEN/PINTEREST_BOARD_ID aren't both set. See the round 91 checklist in CLOUD_CLAUDE.md for the one-time developer-app setup."
    );
  }
  return { accessToken: accessToken!, boardId: boardId! };
}

export const postToPinterest: Poster = async (item) => {
  const { accessToken, boardId } = requireCredentials();
  if (!item.mediaRefs) throw new Error("Pinterest poster: no image URL on this item (mediaRefs is empty).");

  const [title, ...bodyParts] = item.draftText.split("\n\n");
  const description = bodyParts.join("\n\n").trim() || title;

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      media_source: { source_type: "image_url", url: item.mediaRefs },
    }),
  });

  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !data.id) {
    throw new Error(`Pinterest API error (${res.status}): ${data.message ?? "unknown"}`);
  }
  return { url: `https://www.pinterest.com/pin/${data.id}/` };
};
