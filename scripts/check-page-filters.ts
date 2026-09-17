// Round 110 follow-up — two checks in one script, run in the same
// no-silent-regression spirit as check-language-switcher.ts:
//
// 1. Filter presence: every list page named in the round-110 follow-up
//    task doc (/policy, /updates, /processing-times, /visa-bulletin,
//    /news, /faq, /sitemap, EN+ES) must render <PageFilter> or
//    <SitemapFilter> (source-presence, same discipline as the switcher
//    check — an import alone doesn't count).
//
// 2. Header-search availability: AuthHeader is mounted once in the root
//    layout and is session-dependent, so a *statically prerendered*
//    public page bails it to client-only rendering — invisible to
//    curl/crawlers/no-JS, and (per this round's live investigation) the
//    actual reported symptom for /faq, /get-help and /sitemap before
//    they got `export const dynamic = "force-dynamic"`. This check reads
//    the real build output (.next/prerender-manifest.json's `routes` —
//    Next's own record of which paths were statically generated) rather
//    than re-deriving it, so it only runs after `npm run build`. It's
//    scoped to exactly the pages check-language-switcher.ts already
//    tracks (FIXTURE_TO_FILE), not all of PUBLIC_PAGES — a handful of
//    other public pages (the "join" forms, /auth/*) are ALSO statically
//    prerendered today and were never part of this round's reported bug
//    or fix; asserting a stricter invariant here would fail CI on a
//    pre-existing, unrelated, out-of-scope gap. Logged as a follow-up
//    instead of silently expanded into this round.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Round 82 — /policy, /updates, /processing-times, /visa-bulletin and
// /news are in-place localized (one file, ?lang=es), not forked /es/
// routes, so they get a single map entry each. /faq and /sitemap predate
// that pattern and still live as separate src/app/es/* files.
const LISTFILTER_TO_FILE: Record<string, string> = {
  "/policy": "src/app/policy/page.tsx",
  "/updates": "src/app/updates/page.tsx",
  "/processing-times": "src/app/processing-times/page.tsx",
  "/visa-bulletin": "src/app/visa-bulletin/page.tsx",
  "/news": "src/app/news/page.tsx",
  "/faq": "src/app/faq/page.tsx",
  "/es/faq": "src/app/es/faq/page.tsx",
  "/sitemap": "src/app/sitemap/page.tsx",
  "/es/sitemap": "src/app/es/sitemap/page.tsx",
};

// Same FIXTURE_TO_FILE set check-language-switcher.ts already tracks —
// every page a real visitor lands on directly from nav/search/site-index.
const HEADER_SEARCH_TO_FILE: Record<string, string> = {
  "/dashboard": "src/app/dashboard/page.tsx",
  "/plus": "src/app/plus/page.tsx",
  "/get-help": "src/app/get-help/page.tsx",
  "/get-help/ask": "src/app/get-help/ask/page.tsx",
  "/attorneys": "src/app/attorneys/page.tsx",
  "/accredited-representatives": "src/app/accredited-representatives/page.tsx",
  "/legal-aid": "src/app/legal-aid/page.tsx",
  "/pro-bono-representation": "src/app/pro-bono-representation/page.tsx",
  "/dso": "src/app/dso/page.tsx",
  "/community-orgs": "src/app/community-orgs/page.tsx",
  "/processing-times": "src/app/processing-times/page.tsx",
  "/visa-bulletin": "src/app/visa-bulletin/page.tsx",
  "/news": "src/app/news/page.tsx",
  "/policy": "src/app/policy/page.tsx",
  "/updates": "src/app/updates/page.tsx",
  "/faq": "src/app/faq/page.tsx",
  "/sitemap": "src/app/sitemap/page.tsx",
};

function readSource(relativeFile: string): string {
  const abs = path.join(ROOT, relativeFile);
  if (!fs.existsSync(abs)) {
    throw new Error(`file does not exist: ${relativeFile}`);
  }
  return fs.readFileSync(abs, "utf-8");
}

const failures: string[] = [];

// Check 1 — filter presence.
for (const [href, file] of Object.entries(LISTFILTER_TO_FILE)) {
  try {
    const source = readSource(file);
    if (!source.includes("<PageFilter") && !source.includes("<SitemapFilter")) {
      failures.push(`${href} (${file}) -- no <PageFilter> or <SitemapFilter> found`);
    }
  } catch (err) {
    failures.push(`${href} (${file}) -- ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Check 2 — header search availability (requires a prior `npm run build`).
const manifestPath = path.join(ROOT, ".next/prerender-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("check-page-filters: .next/prerender-manifest.json not found -- run `npm run build` first.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as { routes?: Record<string, unknown> };
const staticRoutes = new Set(Object.keys(manifest.routes ?? {}));

for (const [href, file] of Object.entries(HEADER_SEARCH_TO_FILE)) {
  if (staticRoutes.has(href)) {
    failures.push(
      `${href} (${file}) -- statically prerendered, which bails the header's session-dependent AuthHeader to client-only rendering; add "export const dynamic = 'force-dynamic';"`
    );
  }
}

if (failures.length > 0) {
  console.error("Page filter / header search check failed for:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
} else {
  console.log(
    `Filter present on all ${Object.keys(LISTFILTER_TO_FILE).length} list pages; header search available on all ${Object.keys(HEADER_SEARCH_TO_FILE).length} tracked public pages.`
  );
  process.exit(0);
}
