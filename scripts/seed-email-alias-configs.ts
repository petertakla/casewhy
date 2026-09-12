// Round 70 — one-time seed for the 12 casewhy.com response aliases from
// round70-domain-response-aliases-task.md. Safe to re-run: uses onConflictDoNothing
// keyed on the unique `alias` column, so it never overwrites cadence/level
// edits Peter's made since via the admin settings page.

import { getDb } from "../src/lib/db/client";
import { emailAliasConfigs } from "../src/lib/db/schema";

const ALIASES: Array<{
  alias: string;
  purpose: string;
  gmailLabel: string;
  pollIntervalMinutes: number;
  actionLevel: "draft_only" | "draft_and_flag_urgent";
}> = [
  { alias: "privacy", purpose: "General privacy-policy questions", gmailLabel: "Alias/Privacy", pollIntervalMinutes: 60, actionLevel: "draft_only" },
  { alias: "terms", purpose: "Terms of Service questions", gmailLabel: "Alias/Terms", pollIntervalMinutes: 60, actionLevel: "draft_only" },
  { alias: "acknowledgment", purpose: "Replies/confusion about the policy-acknowledgment gate", gmailLabel: "Alias/Acknowledgment", pollIntervalMinutes: 60, actionLevel: "draft_only" },
  { alias: "corrections", purpose: "Users reporting inaccurate content in the app", gmailLabel: "Alias/Corrections", pollIntervalMinutes: 60, actionLevel: "draft_only" },
  { alias: "help", purpose: "General \"how do I…\" user support", gmailLabel: "Alias/Help", pollIntervalMinutes: 30, actionLevel: "draft_only" },
  { alias: "privacy-requests", purpose: "Formal CCPA data-deletion/access requests (real compliance deadlines)", gmailLabel: "Alias/PrivacyRequests", pollIntervalMinutes: 30, actionLevel: "draft_only" },
  { alias: "security", purpose: "Vulnerability/security reports", gmailLabel: "Alias/Security", pollIntervalMinutes: 5, actionLevel: "draft_and_flag_urgent" },
  { alias: "abuse", purpose: "Reports of service misuse", gmailLabel: "Alias/Abuse", pollIntervalMinutes: 30, actionLevel: "draft_and_flag_urgent" },
  { alias: "legal", purpose: "Legal notices, subpoenas, DMCA, law-enforcement requests", gmailLabel: "Alias/Legal", pollIntervalMinutes: 5, actionLevel: "draft_and_flag_urgent" },
  { alias: "billing", purpose: "CaseWhy Plus payment/subscription questions", gmailLabel: "Alias/Billing", pollIntervalMinutes: 30, actionLevel: "draft_only" },
  { alias: "feedback", purpose: "Feature requests / general feedback", gmailLabel: "Alias/Feedback", pollIntervalMinutes: 1440, actionLevel: "draft_only" },
  { alias: "accessibility", purpose: "ADA/accessibility complaints", gmailLabel: "Alias/Accessibility", pollIntervalMinutes: 30, actionLevel: "draft_only" },
];

async function main() {
  const db = getDb();
  const result = await db.insert(emailAliasConfigs).values(ALIASES).onConflictDoNothing({ target: emailAliasConfigs.alias });
  console.log(`Seeded ${ALIASES.length} alias configs (existing ones left untouched).`);
  process.exit(0);
}

main();
