// Round 89 — poster registry. Looked up by channel in approveForAutoPost;
// if nothing is registered, the approve action marks the item approved but
// does not attempt to post -- per the task doc's own instruction, the
// queue UI should show an item as effectively manual_post (text ready to
// copy) rather than fail when no poster exists for its channel, which
// REGISTERED_CHANNELS (exported separately, safe to import client-side)
// supports without leaking any poster implementation/credentials into the
// client bundle.
//
// Round 90 — x/threads registered (LinkedIn explicitly deferred, task
// doc Section 2). Both throw a clear "not configured" error until Peter
// sets their real API credentials (see each poster file's own comment) --
// registered here regardless, since a poster existing and a poster having
// real credentials are different states: approveForAutoPost already
// surfaces a thrown error to Peter rather than silently failing, so the
// queue UI correctly shows these as auto-post (the mechanism is real) even
// before the credentials are.

import type { Poster } from "./types";
import { blogPoster } from "./blog";
import { postToX } from "./x";
import { postToThreads } from "./threads";

const POSTERS: Partial<Record<string, Poster>> = {
  blog: blogPoster,
  x: postToX,
  threads: postToThreads,
};

export function getPosterForChannel(channel: string): Poster | undefined {
  return POSTERS[channel];
}

// Client-safe: just the channel names with a real poster registered, no
// implementation details. Used by the admin card to decide whether to
// show "auto-post" framing or fall back to manual-post framing.
export const REGISTERED_POSTER_CHANNELS: string[] = Object.keys(POSTERS);
