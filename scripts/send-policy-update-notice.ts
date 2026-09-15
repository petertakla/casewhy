// Round 100 — one-time notice to existing account holders that
// privacy.html gained a new Section 2 disclosing how USCIS receipt numbers
// are handled (Section 11's material-change promise). Deliberately a CLI
// script, not a route: this fires once per version bump, not on a
// schedule, and a script that requires someone to actually run it is safer
// for a real bulk send than a web-exposed trigger would be.
//
// Dry-run by default — prints who would be emailed without sending
// anything. Pass --send to actually call Postmark.
//
// Usage:
//   npx tsx scripts/send-policy-update-notice.ts            (dry run)
//   npx tsx scripts/send-policy-update-notice.ts --send      (real send)

import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { POLICY_VERSIONS } from "../src/lib/policy/versions";
import { sendPolicyUpdateSummaryEmail } from "../src/lib/email/postmark";

async function main() {
  const send = process.argv.includes("--send");
  const db = getDb();

  const result = await db.execute<{ email: string }>(
    sql`SELECT email FROM neon_auth."user" WHERE banned IS NOT TRUE ORDER BY email`
  );
  const emails = result.rows.map((r) => r.email);

  const { version, summary } = POLICY_VERSIONS.privacy;
  console.log(`Privacy Policy version: ${version}`);
  console.log(`Summary lines:\n${summary.map((l) => `  - ${l}`).join("\n")}`);
  console.log(`\n${emails.length} account(s) found.`);

  if (!send) {
    console.log("\nDry run — no email sent. Re-run with --send to actually notify these accounts:");
    emails.forEach((e) => console.log(`  ${e}`));
    process.exit(0);
  }

  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    try {
      await sendPolicyUpdateSummaryEmail({
        to: email,
        policyLabel: "Privacy Policy",
        summaryLines: summary,
        policyUrl: "https://www.casewhy.com/privacy.html",
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed to notify ${email}:`, err);
    }
  }
  console.log(`\nDone. Sent: ${sent}, failed: ${failed}.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
