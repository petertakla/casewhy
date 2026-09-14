// Round 93 — the blog channel's "poster." Unlike rounds 90-92's real
// external-API posters, there's no external service to call: the content
// already exists as a file in the repo (content/updates/<slug>.md), and
// this channel's whole point is the round 89 approval click being what
// flips a post from "in the repo" to "publicly visible" (see
// src/lib/updates/updates.ts's gating comment). So "posting" here just
// means resolving the canonical live URL for the approved queue row --
// getPublishedUpdates()/getPublishedUpdateBySlug() reading
// marketingQueue.status === posted/edited_posted for this destination is
// what actually makes the page render, which is already true the moment
// approveForAutoPost's own update lands.

import type { Poster } from "./types";

export const blogPoster: Poster = async (item) => {
  const slug = item.destination.replace(/^\/updates\//, "");
  return { url: `https://app.casewhy.com/updates/${slug}` };
};
