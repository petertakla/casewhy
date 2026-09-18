import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { marketingSettings } from "../db/schema";

// Round 73 (real) — small marketing-queue config constants. Not a runtime-
// editable table (unlike community_source_configs, which the task doc
// explicitly asked to be config-editable) -- these are code-level toggles
// meant to change via a future round's deploy, not a settings screen.

// Product links stay off everywhere until the After Production gate
// (round 79 flips this). While false, draftMarketingReply refuses to
// include any URL at all, even to CaseWhy's own site. Round 98's own
// spec explicitly wants this to stay a code constant, shown read-only on
// the settings page with an explanation -- never a toggle, so nobody
// flips it by accident before the production gate is actually ready.
export const LINKS_ENABLED = false;

// Default/fallback daily cap on drafts created across all community
// channels combined, per the task doc's explicit "Peter's job is 5
// minutes/day, not a firehose" framing. Round 98 made the real, live
// value admin-editable (marketingSettings table, below) -- this constant
// now only matters as the seed value a fresh row starts at and the
// fallback getDailyDraftCap() returns if that row is ever missing.
export const DAILY_DRAFT_CAP = 5;

// How far back to compare a new draft's text against for the dedup check
// (SOCIAL_MEDIA_GUARDRAILS.md Section 1 -- no near-identical replies
// across communities).
export const DEDUP_WINDOW_DAYS = 30;

const SETTINGS_ID = "singleton";

export async function getDailyDraftCap(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ cap: marketingSettings.dailyDraftCap })
    .from(marketingSettings)
    .where(eq(marketingSettings.id, SETTINGS_ID))
    .limit(1);
  return row?.cap ?? DAILY_DRAFT_CAP;
}

export async function setDailyDraftCap(cap: number): Promise<void> {
  const db = getDb();
  await db
    .insert(marketingSettings)
    .values({ id: SETTINGS_ID, dailyDraftCap: cap })
    .onConflictDoUpdate({ target: marketingSettings.id, set: { dailyDraftCap: cap, updatedAt: new Date() } });
}

// Round 90 — Peter's decision, Sep 15 (task doc Section 4): English social
// accounts launch first, Spanish second. Default false; getSpanishSocialEnabled
// is read by /api/cron/poll-policy-news every run to decide whether to also
// draft a Spanish variant.
export async function getSpanishSocialEnabled(): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ enabled: marketingSettings.spanishSocialEnabled })
    .from(marketingSettings)
    .where(eq(marketingSettings.id, SETTINGS_ID))
    .limit(1);
  return row?.enabled ?? false;
}

export async function setSpanishSocialEnabled(enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .insert(marketingSettings)
    .values({ id: SETTINGS_ID, spanishSocialEnabled: enabled })
    .onConflictDoUpdate({ target: marketingSettings.id, set: { spanishSocialEnabled: enabled, updatedAt: new Date() } });
}

// Round 91 — same admin-editable pattern as the two settings above, for
// the Gemini content pipeline's monthly video budget guard (task doc
// Section 2: "config cap on videos/month, default 8").
export const GEMINI_VIDEO_MONTHLY_CAP_DEFAULT = 8;

export async function getGeminiVideoMonthlyCap(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ cap: marketingSettings.geminiVideoMonthlyCap })
    .from(marketingSettings)
    .where(eq(marketingSettings.id, SETTINGS_ID))
    .limit(1);
  return row?.cap ?? GEMINI_VIDEO_MONTHLY_CAP_DEFAULT;
}

export async function setGeminiVideoMonthlyCap(cap: number): Promise<void> {
  const db = getDb();
  await db
    .insert(marketingSettings)
    .values({ id: SETTINGS_ID, geminiVideoMonthlyCap: cap })
    .onConflictDoUpdate({ target: marketingSettings.id, set: { geminiVideoMonthlyCap: cap, updatedAt: new Date() } });
}

// Round 90 prep follow-up (Sep 18) — master switch read by
// approveForAutoPost before it ever calls a channel's poster. Off by
// default (see schema.ts's comment on the column).
export async function getSocialPostingEnabled(): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ enabled: marketingSettings.socialPostingEnabled })
    .from(marketingSettings)
    .where(eq(marketingSettings.id, SETTINGS_ID))
    .limit(1);
  return row?.enabled ?? false;
}

export async function setSocialPostingEnabled(enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .insert(marketingSettings)
    .values({ id: SETTINGS_ID, socialPostingEnabled: enabled })
    .onConflictDoUpdate({ target: marketingSettings.id, set: { socialPostingEnabled: enabled, updatedAt: new Date() } });
}
