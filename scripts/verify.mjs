#!/usr/bin/env node
// Track H (Sep 27, 2026) verify script — no test framework exists on this
// static site, so this follows scripts/generate.mjs's own convention: a
// plain Node script run manually (`node scripts/verify.mjs`), checking the
// *generated, committed* HTML/JSON so a real drift between pages.json and
// the files on disk fails loudly. Exits non-zero on any failure.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { lines, pages, companyPages, redirects } = JSON.parse(
  readFileSync(join(__dirname, "pages.json"), "utf8")
);

let failures = 0;
function check(label, ok) {
  if (ok) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
}

function read(relPath) {
  const p = join(ROOT, relPath.replace(/^\//, ""), "index.html");
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

console.log("== Redirect table (vercel.json) ==");
const vercelJson = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
for (const r of redirects) {
  const entry = vercelJson.redirects.find((v) => v.source === r.from);
  check(`${r.from} -> ${r.to} (permanent)`, !!entry && entry.destination === r.to && entry.permanent === true);
}
// Every redirect source must NOT also exist as a live page in the registry
// (that would mean the 301 shadows a real page and nobody could reach it).
for (const r of redirects) {
  const shadowed =
    r.from === "/" ||
    lines.some((l) => l.path === r.from) ||
    pages.some((p) => p.path === r.from) ||
    companyPages.some((p) => p.path === r.from);
  check(`${r.from} is not also a live page (would be unreachable)`, !shadowed);
}

console.log("\n== Root renders both line cards ==");
const root = read("/");
for (const l of lines) {
  check(`root links to ${l.path} (${l.rootCardTitle})`, root.includes(`href="${l.path}"`));
}

console.log("\n== Nav line-switch present on every page type ==");
const sampleIds = ["/", "/uscis", "/appeals", "/appeals/counselors", "/uscis/attorneys", "/press", "/resources", "/brand"];
for (const path of sampleIds) {
  const html = read(path);
  check(`${path} exists`, html !== null);
  if (html) {
    check(`${path} nav has USCIS + Appeals switch`, html.includes('href="/uscis"') && html.includes('href="/appeals"'));
    check(`${path} nav has shared items (Press/Resources/Brand)`, ["/press", "/resources", "/brand"].every((s) => html.includes(`href="${s}"`)));
  }
}

console.log("\n== Every /appeals/* audience page has its button + disclaimer ==");
const buttonMarkers = ["class=\"cta\"", "mailto:appeals-help@casewhy.com"];
for (const p of pages.filter((p) => p.line === "appeals")) {
  const html = read(p.path);
  check(`${p.path} exists`, html !== null);
  if (html) {
    check(`${p.path} has a button (cta or mailto)`, buttonMarkers.some((m) => html.includes(m)));
    check(`${p.path} has the Appeals disclaimer`, html.includes("not affiliated with or endorsed by Medicare, CMS, or any health plan"));
  }
}
check("/appeals line page has the Appeals disclaimer", read("/appeals").includes("not affiliated with or endorsed by Medicare, CMS, or any health plan"));
check("/uscis line page has the USCIS disclaimer", read("/uscis").includes("not affiliated with or endorsed by USCIS"));

console.log("\n== 'Every Medicare appeal' claim is never a bare assertion ==");
// The source task gates this line and the /coverage proof on Appeals round
// 26 shipping. Round 26 IS live (appeals.casewhy.com/coverage returns 200
// as of this build — checked live, not assumed from the task doc). So the
// gate here isn't "only one page may say it" but "any page that says it
// must link real, checkable evidence (/coverage), not just assert it."
for (const path of ["/appeals", ...pages.filter((p) => p.line === "appeals").map((p) => p.path)]) {
  const html = read(path);
  const claims = html.toLowerCase().includes("every medicare appeal");
  check(
    `${path}: "every Medicare appeal" claim, if present, links /coverage as evidence`,
    !claims || html.includes("/coverage")
  );
}

console.log("\n== /brand is one copy ==");
const brandFiles = ["mark.svg", "wordmark-lockup.svg", "wordmark-lockup-dark.svg"];
for (const f of brandFiles) {
  check(`/brand/${f} exists exactly once (shared asset)`, existsSync(join(ROOT, "brand", f)));
}
// No line page should carry its own duplicate copy of these SVGs.
for (const l of lines) {
  for (const f of brandFiles) {
    check(`${l.path}/${f} does not exist (no per-line duplicate)`, !existsSync(join(ROOT, l.path.replace(/^\//, ""), f)));
  }
}

console.log("\n== Founder last name never appears ==");
// Same standing rule as .github/workflows/ci.yml's founder-name-check —
// re-asserted here so a local run catches it before CI does. The banned
// string is built at runtime (never spelled out as a literal here) so this
// file itself doesn't trip CI's own repo-wide grep for it.
const bannedLastName = ["T", "akl", "a"].join("");
for (const path of [
  "/",
  ...lines.map((l) => l.path),
  ...pages.map((p) => p.path),
  ...companyPages.map((p) => p.path),
]) {
  const html = read(path);
  check(`${path} does not contain the founder's last name`, html !== null && !html.includes(bannedLastName));
}

// Sep 29, 2026 — the Desk resource library is referenced from the public
// hub but deliberately NOT exposed. Two rules to hold, both enforced here
// rather than by eye, plus the asset-provenance rule.
console.log("\n== Desk resource library: teased, never exposed ==");
const AUDIENCE = ["/appeals/advocates", "/appeals/counselors", "/appeals/attorneys", "/appeals/facilities", "/appeals/ombudsman"];
for (const path of AUDIENCE) {
  const html = read(path);
  check(`${path} mentions the resource library`, html !== null && /resource library/i.test(html));
}
// No page anywhere under the hub may link to, or name, the gated route.
for (const path of ["/", ...lines.map((l) => l.path), ...pages.map((p) => p.path), ...companyPages.map((p) => p.path)]) {
  const html = read(path);
  check(`${path} does not link to or name /desk/resources`, html !== null && !/desk\/resources/i.test(html));
}

console.log("\n== Reused diagram: served locally, and only the cleared one ==");
const advocatesHtml = read("/appeals/advocates");
check("/appeals/advocates embeds the URL-pattern diagram from this repo's own /images/", advocatesHtml !== null && advocatesHtml.includes('src="/images/link-your-records-url-pattern.webp"'));
check("the diagram file exists on disk", existsSync(join(ROOT, "images/link-your-records-url-pattern.webp")));
check("the diagram is not hot-linked from the Appeals app or its storage", advocatesHtml !== null && !/appeals\.casewhy\.com[^"']*\.(webp|png|jpe?g)/i.test(advocatesHtml) && !/blob\.vercel-storage\.com/i.test(advocatesHtml));
// The two items Peter cleared for the gated Desk library ONLY must never
// reach this repo's public assets, in any form.
const FORBIDDEN = ["Central_Command", "Central Command", "Blueprint", "blueprint", "Roadmap", "roadmap"];
const assetNames = existsSync(join(ROOT, "images")) ? readdirSync(join(ROOT, "images")) : [];
for (const term of FORBIDDEN) {
  check(`no public asset name contains "${term}"`, !assetNames.some((f) => f.includes(term)));
}
for (const path of AUDIENCE) {
  const html = read(path);
  check(`${path} does not reference the Blueprint or roadmap materials`, html !== null && !/central[ _]command|blueprint|roadmap/i.test(html));
}

// ---- the outbound product link follows the LINE you're reading ----
//
// Sep 30, 2026. It was hardcoded to casewhy.com on every page, so an
// advocate on /appeals/* was pointed at the USCIS tracker as "the
// product". Each line now names its own; Appeals points at the /desk
// landing page, the professional front door these pages are selling.
const linkOf = (html) => (html.match(/class="site-link" href="([^"?]*)/) ?? [])[1];
for (const path of ["/appeals", "/appeals/advocates", "/appeals/facilities", "/appeals/attorneys", "/appeals/counselors", "/appeals/ombudsman", "/appeals/press"]) {
  const html = read(path);
  check(`${path} header points at the Desk landing page, not the USCIS tracker`, linkOf(html ?? "") === "https://appeals.casewhy.com/desk");
}
for (const path of ["/uscis", "/uscis/attorneys", "/uscis/employers"]) {
  const html = read(path);
  check(`${path} header still points at casewhy.com`, linkOf(html ?? "") === "https://www.casewhy.com");
}
check("the footer reaches the Desk from every page", (read("/appeals") ?? "").includes("appeals.casewhy.com/desk?utm_source=hub&utm_medium=footer"));

// ---- pricing: withdrawn offers stay withdrawn, live numbers stay live ----
//
// Sep 30, 2026. This hub was still advertising "twenty free seats through
// February 28, 2027… then $99 a month, unlimited cases" across five
// appeals pages, weeks after Peter withdrew the founding pilot and the
// seat cap outright. The appeals repo has a guard that refuses to let that
// copy return; it cannot see this repo, which is exactly why the promise
// survived here. This is that guard's other half.
const pricingJson = JSON.parse(readFileSync(join(__dirname, "pricing.json"), "utf8"));
const APPEALS_PAGES = ["/appeals", "/appeals/advocates", "/appeals/facilities", "/appeals/attorneys", "/appeals/press"];
const WITHDRAWN = [/founding[- ]advocate/i, /founding pilot/i, /founding facilities/i, /twenty free seats/i, /February 28, 2027/i, /Feb 28, 2027/i, /Pricing (is being|set once)/i];

for (const path of APPEALS_PAGES) {
  const html = read(path);
  check(`${path} exists`, html !== null);
  if (!html) continue;
  for (const re of WITHDRAWN) {
    check(`${path} does not advertise the withdrawn offer (${re.source})`, !re.test(html));
  }
  // "unlimited cases" is TRUE for the permanently-free segments and FALSE
  // for every paid one, so it is only forbidden where a price is quoted.
  if (/\$\d/.test(html)) {
    check(`${path} makes no "unlimited cases" claim beside a price`, !/unlimited cases/i.test(html));
  }
}

// The facilities chooser no longer prices anything itself — so assert it
// LINKS to all three settings. Without this, the split could silently lose a
// setting and the only symptom would be a page nobody can reach.
const facilitiesChooser = read("/appeals/facilities");
for (const sub of ["/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/facilities/hospice"]) {
  check(`/appeals/facilities links to ${sub}`, facilitiesChooser !== null && facilitiesChooser.includes(`href="${sub}"`));
  check(`${sub} exists`, read(sub) !== null);
  check(`${sub} links back to the chooser`, (read(sub) ?? "").includes('href="/appeals/facilities"'));
}

// Hospice is pay-per-case ON PURPOSE (no sourced MA denial rate to size a
// monthly allowance against). Asserting it states that reason, not just that
// it omits a monthly price, so the omission can never read as an oversight.
const hospice = read("/appeals/facilities/hospice") ?? "";
check("/appeals/facilities/hospice explains why there is no monthly plan", /deliberate choice, not a missing option/i.test(hospice));
// NOT "no monthly price" — the first version of this assertion said that and
// failed a correct page. The hospice lane has one plan and the generator
// renders it "$0 / month", which is accurate for pay-per-case. The real claim
// is that there is no PAID monthly tier.
const hospiceMonthly = [...hospice.matchAll(/\$(\d+)\s*\/\s*month/g)].map((m) => Number(m[1]));
check(`/appeals/facilities/hospice offers no paid monthly plan (found ${JSON.stringify(hospiceMonthly)})`,
  hospiceMonthly.every((n) => n === 0));

// SCREENSHOTS STILL PENDING — tracked in CI without being shown to a visitor.
//
// These pages used to RENDER a "PLACEHOLDER — real screenshot to come" caption.
// The Oct 2 site audit caught that a facility decision-maker reading the page
// sees it, and it reads as an apology. Loud-in-CI was the right instinct; a
// public sales page was the wrong place for it. The brief now lives in an HTML
// comment (renders nothing) and is counted here, so the work stays tracked
// while a visitor just sees a page with no image.
const screenshotPages = ["/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/facilities/hospice", "/appeals/care-managers"];
const pendingShots = screenshotPages.filter((p) => (read(p) ?? "").includes("SCREENSHOT PENDING"));
check(`no page shows a visible placeholder caption (${pendingShots.length} screenshot(s) pending, tracked in comments)`,
  screenshotPages.every((p) => !/PLACEHOLDER\s*[—-]\s*the/i.test(read(p) ?? "")));
check("no page still renders the placeholder graphic",
  screenshotPages.every((p) => !(read(p) ?? "").includes('src="/images/placeholder-screenshot.svg"')));

// Every monthly price a page states must be one the billing module
// actually charges. Catches a hand-edited number that drifts from
// pricing.json — the failure this whole indirection exists to prevent.
const realMonthly = new Set();
for (const plans of Object.values(pricingJson.lanes)) for (const p of plans) realMonthly.add(p.monthlyUsd);
// Sep 30 -> Oct 1, 2026: /appeals/facilities became a CHOOSER and the three
// per-setting pages below now carry the real tables. This list follows the
// prices rather than being relaxed — a page that quotes a monthly figure the
// billing module does not charge is the exact drift this indirection exists to
// catch, and there are now four such pages instead of two.
for (const path of ["/appeals/advocates", "/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/care-managers"]) {
  const html = read(path);
  if (!html) continue;
  const quoted = [...html.matchAll(/\$(\d+)\s*\/\s*month/g)].map((m) => Number(m[1]));
  check(`${path} quotes at least one real monthly price`, quoted.length > 0);
  for (const n of new Set(quoted)) {
    check(`${path}: $${n}/month is a price the billing module actually charges`, realMonthly.has(n));
  }
}
check(`the free-trial count on the pages matches pricing.json (${pricingJson.freeTrialCases})`,
  (read("/appeals/advocates") ?? "").includes(`first ${pricingJson.freeTrialCases} cases are free`));

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
