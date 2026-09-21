// Round 73 follow-up (Sep 18) — "add [canonical + Open Graph] to the
// existing metadata CI check so a page without a canonical fails the
// build." Same source-presence discipline as check-page-filters.ts and
// check-language-switcher.ts: reads each page's own source, doesn't
// render anything or hit the network. A page passes by calling the
// shared pageMetadata() helper (src/lib/site/metadata.ts), which always
// sets alternates.canonical + openGraph + twitter together -- so
// checking for the one call covers all three per the doc's own request.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Every public page this round actually touched. Dynamic entity detail
// pages ([slug]/[id]) included -- they hit the same real gap even though
// the round-73 follow-up doc's own checked-page list didn't name them.
// DB-backed pages this round deliberately left alone (none currently;
// news/[id] is content-derived but still file-based like the others
// here) aren't a distinct category worth a separate list.
const HREF_TO_FILE: Record<string, string> = {
  "/faq": "src/app/faq/page.tsx",
  "/es/faq": "src/app/es/faq/page.tsx",
  "/help": "src/app/help/page.tsx",
  "/get-help": "src/app/get-help/page.tsx",
  "/es/get-help": "src/app/es/get-help/page.tsx",
  "/plus": "src/app/plus/page.tsx",
  "/es/plus": "src/app/es/plus/page.tsx",
  "/sitemap": "src/app/sitemap/page.tsx",
  "/es/sitemap": "src/app/es/sitemap/page.tsx",
  "/processing-times": "src/app/processing-times/page.tsx",
  "/visa-bulletin": "src/app/visa-bulletin/page.tsx",
  "/updates": "src/app/updates/page.tsx",
  "/updates/[slug]": "src/app/updates/[slug]/page.tsx",
  "/news": "src/app/news/page.tsx",
  "/news/[id]": "src/app/news/[id]/page.tsx",
  "/policy": "src/app/policy/page.tsx",
  "/policy/[id]": "src/app/policy/[id]/page.tsx",
  "/court-rulings": "src/app/court-rulings/page.tsx",
  "/court-rulings/[id]": "src/app/court-rulings/[id]/page.tsx",
  "/attorneys": "src/app/attorneys/page.tsx",
  "/attorneys/[id]": "src/app/attorneys/[id]/page.tsx",
  "/attorneys/join": "src/app/attorneys/join/page.tsx",
  "/accredited-representatives": "src/app/accredited-representatives/page.tsx",
  "/es/accredited-representatives": "src/app/es/accredited-representatives/page.tsx",
  "/accredited-representatives/[slug]": "src/app/accredited-representatives/[slug]/page.tsx",
  "/accredited-representatives/join": "src/app/accredited-representatives/join/page.tsx",
  "/legal-aid": "src/app/legal-aid/page.tsx",
  "/es/legal-aid": "src/app/es/legal-aid/page.tsx",
  "/legal-aid/[slug]": "src/app/legal-aid/[slug]/page.tsx",
  "/legal-aid/join": "src/app/legal-aid/join/page.tsx",
  "/pro-bono-representation": "src/app/pro-bono-representation/page.tsx",
  "/es/pro-bono-representation": "src/app/es/pro-bono-representation/page.tsx",
  "/pro-bono-representation/[slug]": "src/app/pro-bono-representation/[slug]/page.tsx",
  "/pro-bono-representation/join": "src/app/pro-bono-representation/join/page.tsx",
  "/community-orgs": "src/app/community-orgs/page.tsx",
  "/es/community-orgs": "src/app/es/community-orgs/page.tsx",
  "/community-orgs/[slug]": "src/app/community-orgs/[slug]/page.tsx",
  "/community-orgs/join": "src/app/community-orgs/join/page.tsx",
  "/dso": "src/app/dso/page.tsx",
  "/es/dso": "src/app/es/dso/page.tsx",
  "/dso/[slug]": "src/app/dso/[slug]/page.tsx",
  "/dso/join": "src/app/dso/join/page.tsx",
};

function readSource(relativeFile: string): string {
  const abs = path.join(ROOT, relativeFile);
  if (!fs.existsSync(abs)) {
    throw new Error(`file does not exist: ${relativeFile}`);
  }
  return fs.readFileSync(abs, "utf-8");
}

const failures: string[] = [];

for (const [href, file] of Object.entries(HREF_TO_FILE)) {
  try {
    const source = readSource(file);
    if (!source.includes("pageMetadata(")) {
      failures.push(`${href} (${file}) -- no pageMetadata() call found (no canonical/OG/Twitter tags)`);
    }
  } catch (err) {
    failures.push(`${href} (${file}) -- ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failures.length > 0) {
  console.error("Page metadata check failed for:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
} else {
  console.log(`All ${Object.keys(HREF_TO_FILE).length} tracked pages call pageMetadata() (canonical + OG + Twitter).`);
  process.exit(0);
}
