// Round 89 — the common interface every real channel poster (rounds
// 90-92: X/Threads/LinkedIn, Pinterest/YouTube/TikTok/Instagram, email)
// implements. Only ever called from approveForAutoPost, on a real
// approval click -- never from the polling/drafting path.

export interface MarketingPostItem {
  channel: string;
  draftText: string;
  mediaRefs: string | null;
  // Round 93 — the blog poster needs this to resolve the canonical
  // /updates/<slug> URL it hands back; every other poster (rounds 90-92)
  // is free to ignore it. Real column already existed (marketingQueue.
  // destination), just wasn't threaded through this interface before
  // blog was the first poster that actually needed it.
  destination: string;
}

export interface PosterResult {
  url: string;
}

export type Poster = (item: MarketingPostItem) => Promise<PosterResult>;
