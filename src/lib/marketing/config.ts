// Round 73 (real) — small marketing-queue config constants. Not a runtime-
// editable table (unlike community_source_configs, which the task doc
// explicitly asked to be config-editable) -- these are code-level toggles
// meant to change via a future round's deploy, not a settings screen.

// Product links stay off everywhere until the After Production gate
// (round 79 flips this). While false, draftMarketingReply refuses to
// include any URL at all, even to CaseWhy's own site.
export const LINKS_ENABLED = false;

// Default daily cap on drafts created across all community channels
// combined, per the task doc's explicit "Peter's job is 5 minutes/day,
// not a firehose" framing.
export const DAILY_DRAFT_CAP = 5;

// How far back to compare a new draft's text against for the dedup check
// (SOCIAL_MEDIA_GUARDRAILS.md Section 1 -- no near-identical replies
// across communities).
export const DEDUP_WINDOW_DAYS = 30;
