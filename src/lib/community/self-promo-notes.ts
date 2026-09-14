// Round 85 — per-community self-promotion notes, shown alongside every
// draft per the task doc's explicit instruction ("surface that specific
// community's self-promotion rule alongside the draft, not just the reply
// text"). These are general, well-known defaults, NOT a live-verified
// snapshot of each community's current rules text — subreddit/forum rules
// change and are enforced inconsistently by different mods. Each note says
// so explicitly; Peter should give the community's actual current rules a
// quick look before posting anything with a link, same as
// SOCIAL_MEDIA_GUARDRAILS.md Section 4 says to.

export function selfPromoNoteFor(sourceName: string): string {
  if (sourceName.startsWith("r/")) {
    return (
      `${sourceName}: Reddit's general norm is roughly 90/10 (no more than ~10% of your ` +
      `posting/commenting in a community should link your own site), and most subreddits ` +
      `layer their own stricter self-promo or "no advertising" rule on top, sometimes requiring ` +
      `mod pre-approval. This is general guidance, not a live check of this subreddit's current ` +
      `rules — read ${sourceName}'s own sidebar/rules wiki before posting a link here.`
    );
  }
  return (
    `${sourceName}: no specific self-promotion policy checked for this source (it's a news/RSS ` +
    `feed, not a discussion forum with posting rules) — if replying anywhere on the site itself ` +
    `(comments, forums), check that section's own posting guidelines first.`
  );
}
