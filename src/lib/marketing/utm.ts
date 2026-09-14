// Round 93 Part C — every link the marketing_queue (round 89) or a
// future email cron emits goes through this, so a click can be traced
// back to the channel/round that generated it. Stored on
// marketingQueue.utmLink (round 89's column, unused until this round).

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
}

export function buildUtmLink(url: string, { source, medium, campaign }: UtmParams): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
