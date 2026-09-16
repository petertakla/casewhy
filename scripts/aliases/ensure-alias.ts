// Round 113 — scripts/aliases/ensure-alias.ts <local-part>
// Idempotent Workspace alias creation on info@casewhy.com via the
// Directory API (src/lib/email-aliases/directory-client.ts). Needs
// GMAIL_SERVICE_ACCOUNT_KEY + GMAIL_IMPERSONATE_EMAIL in the environment
// (only set in Vercel's Production env as of this round — run this via
// the /api/admin/ensure-alias route in production, or locally with those
// two vars set). Usage: node --env-file=.env.local ./node_modules/.bin/tsx scripts/aliases/ensure-alias.ts social

import { ensureAlias } from "../../src/lib/email-aliases/directory-client";

async function main() {
  const localPart = process.argv[2];
  if (!localPart) {
    console.error("Usage: ensure-alias.ts <local-part>");
    process.exit(1);
  }
  const result = await ensureAlias(localPart);
  console.log(result.created ? `Created: ${result.alias}` : `Already exists: ${result.alias}`);
}

main().catch((err) => {
  console.error("ensure-alias failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
