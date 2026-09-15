// Round 98 item 7 — pulled out of MarketingQueueCard.tsx (unchanged
// otherwise, per the task doc's own "keep the card component unchanged"
// instruction) so the queue page can group sections in the same channel
// order the card already used for its own label lookup, without
// duplicating this 16-entry map in two files.

export const CHANNEL_LABELS: Record<string, string> = {
  reddit: "Reddit",
  facebook: "Facebook",
  visajourney: "VisaJourney",
  trackitt: "Trackitt",
  immigration_com: "Immigration.com",
  quora: "Quora",
  x: "X",
  threads: "Threads",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  email: "Email",
  outreach: "Outreach",
  blog: "Blog",
};

// Community channels first, then owned -- matches marketingChannelEnum's
// own declaration order in schema.ts, which already happens to be
// grouped this way.
export const CHANNEL_ORDER: string[] = Object.keys(CHANNEL_LABELS);
