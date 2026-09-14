// Round 89 — poster registry. Empty for every real channel as of this
// round (rounds 90-92 register X/Threads/LinkedIn,
// Pinterest/YouTube/TikTok/Instagram, and email respectively). Looked up
// by channel in approveForAutoPost; if nothing is registered, the
// approve action marks the item approved but does not attempt to post --
// per the task doc's own instruction, the queue UI should show an item
// as effectively manual_post (text ready to copy) rather than fail when
// no poster exists for its channel, which REGISTERED_CHANNELS (exported
// separately, safe to import client-side) supports without leaking any
// poster implementation/credentials into the client bundle.

import type { Poster } from "./types";
import { blogPoster } from "./blog";

const POSTERS: Partial<Record<string, Poster>> = {
  // Round 93 — the first real (non-noop) entry. Real entries for the
  // rest land in rounds 90-92, e.g.:
  //   x: postToX,
  //   linkedin: postToLinkedIn,
  blog: blogPoster,
};

export function getPosterForChannel(channel: string): Poster | undefined {
  return POSTERS[channel];
}

// Client-safe: just the channel names with a real poster registered, no
// implementation details. Used by the admin card to decide whether to
// show "auto-post" framing or fall back to manual-post framing.
export const REGISTERED_POSTER_CHANNELS: string[] = Object.keys(POSTERS);
