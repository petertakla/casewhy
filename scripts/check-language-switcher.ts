// Round 105 — "a CI check that renders every registry page plus one
// dynamic page per type and fails the build naming any page without the
// switcher — that's what round 99 should have included." No dev server,
// no live fetch: every other CI-only script in this repo (validate-jsonld
// above it in ci.yml) works straight off source/data with zero network
// dependency, and this check follows the same discipline. A page "has the
// switcher" if its own page.tsx source contains the <LanguageSwitcher>
// component directly, or composes it indirectly via <PublicPage> (the
// round-99/101 shared shell that renders one internally — see
// src/components/PublicPage.tsx). That's a source-presence check, not a
// real render, but it catches exactly the failure this round exists to
// prevent: a page that never wires the component in at all. Verified live
// by literally deleting a <LanguageSwitcher> line from a page on a branch
// and confirming this script names that exact path, then restoring it.
//
// FIXTURE_TO_FILE below is a hand-maintained map, deliberately -- same
// spirit as PUBLIC_PAGES itself being hand-maintained. A PUBLIC_PAGES
// entry with an app-relative href, not external, and not switcherExempt
// that has no matching map entry is itself a failure (not a silent skip):
// the whole point is that adding a new public page can't quietly bypass
// this check by never being taught to it.

import fs from "fs";
import path from "path";
import { PUBLIC_PAGES } from "../src/lib/site/pages";

const ROOT = process.cwd();

// Fixed PUBLIC_PAGES entries -> their page.tsx source file.
const FIXTURE_TO_FILE: Record<string, string> = {
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
  "/court-rulings": "src/app/court-rulings/page.tsx",
  "/updates": "src/app/updates/page.tsx",
  "/faq": "src/app/faq/page.tsx",
  "/sitemap": "src/app/sitemap/page.tsx",
};

// One representative dynamic page per type -- same template renders every
// row of that type, so checking the template once covers all of them.
const DYNAMIC_TEMPLATES: Record<string, string> = {
  "/policy/[id]": "src/app/policy/[id]/page.tsx",
  "/court-rulings/[id]": "src/app/court-rulings/[id]/page.tsx",
  "/updates/[slug]": "src/app/updates/[slug]/page.tsx",
  "/attorneys/[id]": "src/app/attorneys/[id]/page.tsx",
  "/accredited-representatives/[slug]": "src/app/accredited-representatives/[slug]/page.tsx",
  "/legal-aid/[slug]": "src/app/legal-aid/[slug]/page.tsx",
  "/dso/[slug]": "src/app/dso/[slug]/page.tsx",
  "/community-orgs/[slug]": "src/app/community-orgs/[slug]/page.tsx",
  "/pro-bono-representation/[slug]": "src/app/pro-bono-representation/[slug]/page.tsx",
};

function hasSwitcher(relativeFile: string): boolean {
  const abs = path.join(ROOT, relativeFile);
  if (!fs.existsSync(abs)) {
    throw new Error(`file does not exist: ${relativeFile}`);
  }
  const source = fs.readFileSync(abs, "utf-8");
  // The JSX opening tag specifically, not a bare "LanguageSwitcher" string
  // match -- an import line alone (component imported but never rendered)
  // must NOT satisfy this check. Caught live: the first version of this
  // script matched the import statement itself and silently passed a page
  // with the actual <LanguageSwitcher .../> line deleted.
  return source.includes("<LanguageSwitcher") || source.includes("<PublicPage");
}

const failures: string[] = [];

// Fixed registry pages.
for (const entry of PUBLIC_PAGES) {
  if (entry.external || !entry.href.startsWith("/") || entry.switcherExempt) continue;

  const file = FIXTURE_TO_FILE[entry.href];
  if (!file) {
    failures.push(`${entry.href} -- no entry in scripts/check-language-switcher.ts's FIXTURE_TO_FILE map`);
    continue;
  }

  try {
    if (!hasSwitcher(file)) {
      failures.push(`${entry.href} (${file}) -- no LanguageSwitcher or <PublicPage> found`);
    }
  } catch (err) {
    failures.push(`${entry.href} (${file}) -- ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Representative dynamic pages, one per type.
for (const [label, file] of Object.entries(DYNAMIC_TEMPLATES)) {
  try {
    if (!hasSwitcher(file)) {
      failures.push(`${label} (${file}) -- no LanguageSwitcher or <PublicPage> found`);
    }
  } catch (err) {
    failures.push(`${label} (${file}) -- ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failures.length > 0) {
  console.error("Language switcher check failed for:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
} else {
  console.log(
    `Language switcher present on all ${Object.keys(FIXTURE_TO_FILE).length} fixed public pages and ${Object.keys(DYNAMIC_TEMPLATES).length} dynamic page templates.`
  );
  process.exit(0);
}
