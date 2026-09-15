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
