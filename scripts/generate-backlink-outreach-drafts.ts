// Round 84 — generates one draft outreach email per attorney-directory
// listing that has a real email on file, queued in pending_backlink_outreach
// for manual review. Idempotent: skips any attorney that already has a row
// (the unique constraint on attorney_id would reject a duplicate insert
// anyway, but checking first keeps re-runs quiet rather than noisy).
//
// Scoped to attorneys only — see schema.ts's own comment on
// pendingBacklinkOutreach for why the other five Get Help entity types
// don't have a per-listing email to draft to.
//
// This script only ever INSERTs draft rows. Nothing it does sends
// anything — see src/app/admin/backlink-outreach/actions.ts for the only
// two things that can happen to a row after this (approve/reject), and
// CLOUD_CLAUDE.md's round 84 report for why "approved" still isn't "sent."
//
// Usage:
//   npx tsx scripts/generate-backlink-outreach-drafts.ts

import { isNotNull } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { attorneyDirectory, pendingBacklinkOutreach } from "../src/lib/db/schema";

// Round 84 correction — the original version of this file assumed the LLC's
// registered mailing address was still unavailable (round 84's own task doc
// said so). That was stale: round 67 (Sep 10) already resolved it and
// applied it to privacy.html and the attorney-email-campaign's CAN-SPAM
// footer requirement. Since this IS real marketing/outreach email (not
// transactional), CAN-SPAM requires a physical address and a functional
// opt-out in the message itself — both included below now that the address
// is confirmed available. Actually sending is still a separate decision
// (see actions.ts's own comment) — this only makes the draft itself
// legally complete once someone does approve and send it.
const CAN_SPAM_FOOTER =
  "\n\n---\nCaseWhy LLC, 7901 4th St N, Ste 300, St. Petersburg, FL 33702, US\nDon't want emails like this? Reply and let us know — we'll take care of it.";

// Some attorneyDirectory records carry a preferred name in quotes at the
// end (e.g. `William Gary Gerstein "Bill"`, sourced from state bar
// records) — greeting with the legal first name instead reads as more
// templated than it needs to when the record already tells us what they
// go by. Falls back to the ordinary first name when there's no quoted
// suffix, or when the nickname's first word matches it anyway.
function greetingNameFor(name: string): string {
  const match = name.match(/"([^"]+)"\s*$/);
  return match ? match[1].split(" ")[0] : name.split(" ")[0];
}

function draftFor(attorney: { name: string; firm: string | null; slug: string }): { subject: string; body: string } {
  const listingUrl = `https://app.casewhy.com/attorneys/${attorney.slug}`;
  const firmLine = attorney.firm ? ` at ${attorney.firm}` : "";
  return {
    subject: `Your free listing on CaseWhy's immigration attorney directory`,
    body:
      [
        `Hi ${greetingNameFor(attorney.name)},`,
        "",
        `I wanted to let you know${firmLine ? " that" : ""} you're listed on CaseWhy's free immigration attorney directory${firmLine}:`,
        "",
        listingUrl,
        "",
        "CaseWhy is a free tool that helps people track and understand their USCIS case status. The directory is entirely free — no fees, no ads, no referral cut — sourced from your state bar's own board-certification records.",
        "",
        "If you'd like, feel free to link to your listing page from your own site or social profiles — it's a real, permanent page, not a landing page that'll disappear.",
        "",
        "If anything on the listing is out of date, you can report it directly from the page, or just reply to this email.",
        "",
        "Best,",
        "The CaseWhy team",
      ].join("\n") + CAN_SPAM_FOOTER,
  };
}

async function main() {
  const db = getDb();

  const attorneys = await db
    .select({
      id: attorneyDirectory.id,
      slug: attorneyDirectory.slug,
      name: attorneyDirectory.name,
      firm: attorneyDirectory.firm,
      email: attorneyDirectory.email,
    })
    .from(attorneyDirectory)
    .where(isNotNull(attorneyDirectory.email));

  const existing = await db.select({ attorneyId: pendingBacklinkOutreach.attorneyId }).from(pendingBacklinkOutreach);
  const existingIds = new Set(existing.map((r) => r.attorneyId));

  let created = 0;
  let skipped = 0;

  for (const attorney of attorneys) {
    if (existingIds.has(attorney.id)) {
      skipped++;
      continue;
    }
    if (!attorney.email) continue; // TS narrowing; isNotNull already filtered this at the SQL level

    const { subject, body } = draftFor(attorney);
    await db.insert(pendingBacklinkOutreach).values({
      attorneyId: attorney.id,
      attorneyName: attorney.name,
      attorneyEmail: attorney.email,
      listingUrl: `https://app.casewhy.com/attorneys/${attorney.slug}`,
      draftSubject: subject,
      draftBody: body,
    });
    created++;
  }

  console.log(`Drafted ${created} new outreach emails, skipped ${skipped} already-queued.`);
}

main();
