// Round 89 — a deliberately fake poster used only to verify the queue's
// approve -> post plumbing works end to end (the task doc's own
// verify-live bullet: "a test auto_post item with the noop poster moves
// to posted only after an approval click, never on creation"). Never
// registered against a real channel in the registry below -- it's
// invoked directly by verification scripts, not reachable through the
// normal admin approve action for any real channel.

import type { Poster } from "./types";

export const noopPoster: Poster = async (item) => {
  return { url: `https://example.invalid/noop-post/${encodeURIComponent(item.channel)}/${Date.now()}` };
};
