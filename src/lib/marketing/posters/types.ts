// Round 89 — the common interface every real channel poster (rounds
// 90-92: X/Threads/LinkedIn, Pinterest/YouTube/TikTok/Instagram, email)
// implements. Only ever called from approveForAutoPost, on a real
// approval click -- never from the polling/drafting path.

export interface MarketingPostItem {
  channel: string;
  draftText: string;
  mediaRefs: string | null;
}

export interface PosterResult {
  url: string;
}

export type Poster = (item: MarketingPostItem) => Promise<PosterResult>;
