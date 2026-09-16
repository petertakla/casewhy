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
import { postToPinterest } from "./pinterest";
import { postToYoutube } from "./youtube";

// Round 91 — Pinterest/YouTube registered (real posters, gated on
// Peter's own credentials, same "poster exists, credentials might not
// yet" pattern as round 90's X/Threads). TikTok/Instagram deliberately
// NOT registered here -- no approved app exists for either (the task
// doc's own explicit fallback: ship those as manual_post with a download
// link, don't block the round on an app-review queue that can take
// weeks). Facebook also not registered -- guardrails Section 0, group
// channels are always manual_post regardless of poster availability.
const POSTERS: Partial<Record<string, Poster>> = {
  blog: blogPoster,
  x: postToX,
  threads: postToThreads,
  pinterest: postToPinterest,
  youtube: postToYoutube,
};

export function getPosterForChannel(channel: string): Poster | undefined {
  return POSTERS[channel];
}

// Round 91 -- REGISTERED_POSTER_CHANNELS moved to its own file
// (./registered-channels.ts). Deriving it from Object.keys(POSTERS) here
// meant any client component importing it (MarketingQueueCard.tsx does)
// transitively imported every poster implementation, including
// youtube.ts's googleapis dependency -- a real client-bundle build
// failure ("Can't resolve 'net'") caught locally before deploying. A
// dev-time check keeps the two lists from silently drifting apart.
import { REGISTERED_POSTER_CHANNELS } from "./registered-channels";
if (process.env.NODE_ENV !== "production") {
  const actual = Object.keys(POSTERS).sort().join(",");
  const declared = [...REGISTERED_POSTER_CHANNELS].sort().join(",");
  if (actual !== declared) {
    throw new Error(
      `registered-channels.ts (${declared}) is out of sync with registry.ts's POSTERS (${actual}) -- update both when adding/removing a poster.`
    );
  }
}
