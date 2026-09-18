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
import { postToFacebookPage } from "./facebook";
import { postToTikTok } from "./tiktok";

// Round 91 — Pinterest/YouTube registered (real posters, gated on
// Peter's own credentials, same "poster exists, credentials might not
// yet" pattern as round 90's X/Threads). Instagram deliberately NOT
// registered -- hit a real Meta platform gap, parked (see facebook.ts's
// own comment for the "Profile Plus" finding that also explains why
// Facebook needed its own dedicated Business-Portfolio token-fetch
// route instead of the usual me/accounts one).
//
// Round 90 follow-up — Facebook registered. Same channel value is still
// used for Facebook *group* posts (guardrails Section 0, always
// manual_post) -- registering a poster here only affects rows whose own
// `mode` is "auto_post" (the Page's own posts), group rows are
// unaffected since approveForAutoPost only ever invokes a poster on
// that specific dispatch.
//
// Round 91A follow-up — TikTok registered. Real OAuth app + Content
// Posting API integration (see tiktok.ts's own comment on its rotating
// refresh token, stored in the DB rather than an env var).
const POSTERS: Partial<Record<string, Poster>> = {
  blog: blogPoster,
  x: postToX,
  threads: postToThreads,
  pinterest: postToPinterest,
  youtube: postToYoutube,
  facebook: postToFacebookPage,
  tiktok: postToTikTok,
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
