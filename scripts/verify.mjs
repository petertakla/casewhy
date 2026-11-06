#!/usr/bin/env node
// Track H (Sep 27, 2026) verify script — no test framework exists on this
// static site, so this follows scripts/generate.mjs's own convention: a
// plain Node script run manually (`node scripts/verify.mjs`), checking the
// *generated, committed* HTML/JSON so a real drift between pages.json and
// the files on disk fails loudly. Exits non-zero on any failure.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
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
// ---------------------------------------------------------------------------
// ARE WE CHECKING THE CURRENT PAGES, OR YESTERDAY'S?
//
// THIS CHECK EXISTS BECAUSE EVERYTHING BELOW IT PASSED ON A DEAD BUILD, TWICE
// IN TWO DAYS. Both times a backtick inside a CSS comment closed the
// generator's own template literal; generate.mjs died loudly with a
// SyntaxError, and this file then verified 516 checks against the pages built
// BEFORE the change and printed "All checks passed."
//
// A verification that cannot tell a fresh artifact from a stale one is worse
// than no verification: it converts a loud failure into a green tick.
//
// So before anything else: no built page may be older than the newest input
// that produces it. The inputs are the generator, its page registry, the
// pricing it substitutes, and every content file.
const buildInputs = [
  join(__dirname, "generate.mjs"),
  join(__dirname, "pages.json"),
  join(__dirname, "pricing.json"),
  ...readdirSync(join(__dirname, "content")).map((f) => join(__dirname, "content", f)),
].filter((f) => existsSync(f));
const newestInput = Math.max(...buildInputs.map((f) => statSync(f).mtimeMs));
// A SAMPLE, NOT EVERY PAGE. One stale page means the whole run is stale —
// they are written by a single pass — and reading three is enough to say so
// while keeping this cheap.
//
// THE PATH IS BUILT FROM `path`, NOT FROM `id`. The first version of this
// looked pages up by `id` and read a non-existent `out` field; `id` is a slug
// like "uscis-attorneys" and the URL lives in `path`. Every lookup missed, the
// sample list came out EMPTY, and the check passed on a build it had not read
// — which is precisely the failure it was written to catch, committed inside
// the catcher. Found by planting the real bug and watching it stay green.
// EVERY INTERNAL LINK IS NOW A FULL LINK — Peter's rule, applied across the
// hub on 1 Nov 2026. These assertions were all written against `href="/x"`,
// so twenty-seven of them went red at once. They are rewritten to the absolute
// form rather than loosened: `href="${ORIGIN}/x"` is still an exact match, and
// a page that reverted to a relative link would fail here, which is the point.
const ORIGIN = "https://casewhyhub.com";

const builtSamples = ["/appeals/enterprise", "/appeals", "/"]
  .map((url) => join(ROOT, url === "/" ? "index.html" : `${url.replace(/^\//, "")}/index.html`))
  .filter((f) => existsSync(f));
// AND IT MUST HAVE FOUND SOMETHING. An empty sample makes every assertion
// below it vacuously true, which is how the first version reported "0 stale"
// about nothing at all.
check(
  `the staleness check found pages to read (${builtSamples.length})`,
  builtSamples.length === 3,
  "could not resolve the sample pages on disk — this check would pass without reading anything"
);
const stale = builtSamples.filter((f) => statSync(f).mtimeMs < newestInput);
check(
  `the built pages are newer than the generator and its content (${stale.length} stale)`,
  stale.length === 0,
  stale.length ? `Run \`node scripts/generate.mjs\` and READ ITS EXIT CODE — these pages predate their source:\n    ${stale.map((f) => f.slice(ROOT.length + 1)).join("\n    ")}` : ""
);

const vercelJson = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
for (const r of redirects) {
  const entry = vercelJson.redirects.find((v) => v.source === r.from);
  // `permanent` comes from the registry: true unless the entry says
  // `"permanent": false`. The four campaign short links do -- they are the
  // addresses printed in the outreach letters and have always served 307.
  // This used to assert `=== true` for every row, which is why adding them
  // to pages.json turned this red on 12 Oct.
  const wantPermanent = r.permanent !== false;
  check(
    `${r.from} -> ${r.to} (${wantPermanent ? "permanent" : "temporary"})`,
    !!entry && entry.destination === r.to && entry.permanent === wantPermanent,
  );
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
  check(`root links to ${l.path} (${l.rootCardTitle})`, root.includes(`href="${ORIGIN}${l.path}"`));
}

console.log("\n== Nav line-switch present on every page type ==");
const sampleIds = ["/", "/uscis", "/appeals", "/appeals/counselors", "/uscis/attorneys", "/press", "/resources", "/brand"];
for (const path of sampleIds) {
  const html = read(path);
  check(`${path} exists`, html !== null);
  if (html) {
    check(`${path} nav has USCIS + Appeals switch`, html.includes(`href="${ORIGIN}/uscis"`) && html.includes(`href="${ORIGIN}/appeals"`));
    check(`${path} nav has shared items (Press/Resources/Brand)`, ["/press", "/resources", "/brand"].every((s) => html.includes(`href="${ORIGIN}${s}"`)));
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
// must show real, checkable evidence, not just assert it."
//
// WIDENED Oct 2, 2026: naming all six appeal types IN THE PAGE now counts as
// evidence, alongside a link to /coverage. The link used to be the only
// accepted proof, which forced /appeals to send advocates into the consumer
// app — where the family header pitches Appeals Plus at a professional. Naming
// the six inline is strictly better evidence than a link anyway: the reader
// sees the answer instead of being sent to find it.
const SIX_PACKS = ["Medicare Advantage", "Part D", "Original Medicare", "premiums", "enrollment", "PACE"];
const namesAllSixPacks = (html) => SIX_PACKS.every((p) => html.includes(p));
for (const path of ["/appeals", ...pages.filter((p) => p.line === "appeals").map((p) => p.path)]) {
  const html = read(path);
  const claims = html.toLowerCase().includes("every medicare appeal");
  check(
    `${path}: "every Medicare appeal" claim, if present, shows evidence (names all six packs, or links /coverage)`,
    !claims || namesAllSixPacks(html) || html.includes("/coverage")
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

// ---- AND THE FAMILIES PAGE IS THE ONE EXCEPTION ----
//
// 15 Oct 2026, Peter: the families page showed the Desk link at the top and he
// asked for the right one instead. The rule above is right for the pages it
// names and its own comment says why — the Desk is "the professional front
// door these pages are selling". It was written on 30 Sep, when every appeals
// page sold to professionals; the families page arrived afterwards and
// inherited a header meant for a different reader. The list above never
// covered it, which is why nothing failed.
//
// Peter chose the plain family front door, so a family clicking the one
// outbound link in the header lands where the letters send them rather than on
// a professional sign-in.
check(
  "/appeals/families header points at the family site, NOT the Desk",
  linkOf(read("/appeals/families") ?? "") === "https://appeals.casewhy.com"
);
// The reference Peter asked for in the same breath. `inLineNav` puts it in the
// AUDIENCE CARDS on /appeals — "Find your page" — which is the hub's own index
// of who each page is for. My first version of this check asserted a "line
// nav" on /appeals/advocates and failed: inLineNav does not build a nav on
// sub-pages, and the check was describing a surface that does not exist.
// Fixed by reading the generator rather than by relaxing the assertion.
check(
  "/appeals references the families page in its audience cards",
  (read("/appeals") ?? "").includes(`href="${ORIGIN}/appeals/families"`)
);
// With its own words, not a bare URL — a card whose title vanished would still
// satisfy the check above while reading as an empty box.
check(
  "and the families card carries its title",
  (read("/appeals") ?? "").includes("Families &amp; caregivers") ||
    (read("/appeals") ?? "").includes("Families & caregivers")
);
// AND IT IS NOW OFFERED TO SEARCH, ON PETER'S WORDS. 15 Oct, asked whether to
// index it, he said: "index it". So `draft` is dropped and the page is an
// ordinary one, which is exactly what the generator's own note said should
// happen "when he approves the copy".
//
// THIS CHECK IS THE INVERSE OF THE ONE IT REPLACES, and that is the mechanism
// working rather than a reversal. For the twenty minutes between his two
// instructions it asserted the page stayed unindexed, so that dropping the
// flag could not happen quietly — it had to go red and be answered. He
// answered it.
//
// Both halves, because they fail independently: the robots tag is per-page and
// the sitemap is a separate file, and an indexable page missing from the
// sitemap is the failure nobody notices.
check(
  "the families page is indexable — no noindex tag",
  !(read("/appeals/families") ?? "").includes('name="robots" content="noindex')
);
// READ DIRECTLY, NOT THROUGH `read()` — that helper appends "/index.html",
// so `read("/sitemap.xml")` looks for `sitemap.xml/index.html` and returns
// null for every sitemap question ever asked of it.
//
// THIS BIT ME IN THE USEFUL DIRECTION AND I AM RECORDING IT. The check this
// replaced asserted the sitemap did NOT contain the page, as
// `!(read("/sitemap.xml") ?? "").includes(...)`. With the read returning null
// that is `!false` — green, always, whatever the sitemap said. It passed for
// twenty minutes on a premise that was never tested. The inverse failed
// immediately, which is the only reason I looked.
check(
  "and the sitemap offers it",
  readFileSync(join(ROOT, "sitemap.xml"), "utf8").includes("/appeals/families")
);
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
const familiesPricing = JSON.parse(readFileSync(join(__dirname, "families-pricing.json"), "utf8"));
// /appeals/counselors and /appeals/ombudsman were MISSING from this list, and
// they are the two pages Peter named on 12 Oct when he found them still
// promising "free, forever" and "Unlimited cases". The sweep that was meant
// to stop withdrawn copy returning could not see the pages it mattered most
// on. Added.
const APPEALS_PAGES = [
  "/appeals",
  "/appeals/advocates",
  "/appeals/facilities",
  "/appeals/attorneys",
  "/appeals/press",
  "/appeals/counselors",
  "/appeals/ombudsman",
];
const WITHDRAWN = [
  /founding[- ]advocate/i, /founding pilot/i, /founding facilities/i,
  /twenty free seats/i, /February 28, 2027/i, /Feb 28, 2027/i,
  /Pricing (is being|set once)/i,
  // 12 Oct 2026 -- Peter: "fix these two to say the correct statement".
  // "free, forever", "permanently" and "Unlimited cases" stopped being true
  // when fair-use limits existed, and he removed the numbers from
  // /for-advocates the same morning. The approved sentence is "Free for
  // SHIP, ombudsman, legal aid and nonprofit organizations -- fair-use limits
  // apply."
  //
  // DELIBERATELY NOT a bare /unlimited/: "one license per site, unlimited
  // staff" on /appeals is the facility site license and is TRUE, and
  // /uscis/press's "unlimited questions" is a different product. code3's
  // 0763 §2 caught that a blanket fix would break both.
  /\bforever\b/i, /permanently/i, /Unlimited cases/i,
];

for (const path of APPEALS_PAGES) {
  const html = read(path);
  check(`${path} exists`, html !== null);
  if (!html) continue;
  for (const re of WITHDRAWN) {
    check(`${path} does not advertise the withdrawn offer (${re.source})`, !re.test(html));
  }
  // NO LONGER TRUE ANYWHERE: "unlimited cases" was true for the
  // permanently-free segments until 12 Oct, when Peter withdrew the claim --
  // it is now in WITHDRAWN above and forbidden on every appeals page, not
  // only beside a price. This narrower check is kept because it covers pages
  // outside APPEALS_PAGES that quote a price.
  if (/\$\d/.test(html)) {
    check(`${path} makes no "unlimited cases" claim beside a price`, !/unlimited cases/i.test(html));
  }
}

// The facilities chooser no longer prices anything itself — so assert it
// LINKS to all three settings. Without this, the split could silently lose a
// setting and the only symptom would be a page nobody can reach.
const facilitiesChooser = read("/appeals/facilities");
for (const sub of ["/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/facilities/hospice"]) {
  check(`/appeals/facilities links to ${sub}`, facilitiesChooser !== null && facilitiesChooser.includes(`href="${ORIGIN}${sub}"`));
  check(`${sub} exists`, read(sub) !== null);
  check(`${sub} links back to the chooser`, (read(sub) ?? "").includes(`href="${ORIGIN}/appeals/facilities"`));
}

// HOSPICE GAINED A SITE LICENSE ON 30 OCT 2026, so these checks inverted —
// and the invariant behind them did not. What mattered was never "hospice has
// no monthly plan"; it was that the PAGE and the PRICE BOOK cannot disagree,
// because the old prose outlived the rule it described for exactly as long as
// nothing checked it.
//
// So the page must now show the per-case price FIRST (Peter, 27 Oct: "change
// to lead with per case then site") and must not claim the monthly plan does
// not exist.
const hospice = read("/appeals/facilities/hospice") ?? "";
check("/appeals/facilities/hospice no longer claims there is no monthly plan",
  !/deliberate choice, not a missing option/i.test(hospice) && !/pay-per-case only/i.test(hospice));
const hospiceMonthly = [...hospice.matchAll(/\$(\d+)\s*\/\s*month/g)].map((m) => Number(m[1]));
check(`/appeals/facilities/hospice shows its site license (found ${JSON.stringify(hospiceMonthly)})`,
  // A PAID tier must be present now. The $0 entry is the pay-as-you-go plan,
  // which the generator renders as "$0 / month" and which stays — so the test
  // is that SOMETHING above zero is offered, not that everything is.
  hospiceMonthly.some((n) => n > 0));

// ADVOCATE-FACING PAGES MUST NOT SEND A VISITOR INTO THE CONSUMER APP.
//
// Found live Oct 2, 2026, twice. /appeals' own sub-heading linked "the coverage
// map" at appeals.casewhy.com/coverage — a page that renders the FAMILY header
// ("Appeals Plus", "Start your case") because it genuinely serves both
// audiences and cannot be given advocate chrome by path without breaking it for
// families. A signed-in advocate is now handled by identity (the Appeals app
// suppresses family chrome for any Desk seat holder), but an ANONYMOUS visitor
// arriving from this hub has no seat to read, and that is exactly who reads a
// partner site.
//
// So the fix is here, at the link: /appeals now names all six appeal types in
// its own bullet list and does not send anyone to /coverage to find them.
//
// /appeals/press is deliberately exempt: it already names the six types inline,
// and a journalist seeing the consumer product is reporting on it, not being
// mis-sold to.
const CONSUMER_APP_PAGES = ["/coverage", "/plus", "/tracker", "/forms"];

// TWO PAGES ARE EXEMPT, AND BOTH FOR A STATED REASON — not to make the check
// pass. The rule being enforced is "an advocate-facing page must not send the
// ADVOCATE into the consumer app to learn about the product". It is not "no
// consumer URL may ever appear".
//
//   appeals-counselors — its whole section is headed "Free pages you can hand
//     out today". Those links exist for the counselor to GIVE A FAMILY, and a
//     family seeing the family chrome is exactly right. Caught as a false
//     positive by this check on the day it was written, and exempted rather
//     than "fixed" by mangling a correct page.
//   appeals-press — names all six appeal types inline already, and a
//     journalist looking at the consumer product is reporting on it, not being
//     mis-sold to.
//
// Any NEW page is covered by default. Adding an exemption means adding a line
// here and a reason, which is the point.
const CONSUMER_LINK_EXEMPT = new Set(["appeals-press", "appeals-counselors"]);
for (const page of ["/appeals", ...pages.filter((p) => p.line === "appeals" && !CONSUMER_LINK_EXEMPT.has(p.id)).map((p) => p.path)]) {
  const html = read(page);
  if (!html) continue;
  for (const consumer of CONSUMER_APP_PAGES) {
    check(`${page} does not send an advocate to the consumer ${consumer} page`,
      !html.includes(`appeals.casewhy.com${consumer}?`) && !html.includes(`appeals.casewhy.com${consumer}"`));
  }
}

// NO HUB PAGE MAY LINK TO A SIGNED-IN-ONLY DESTINATION.
//
// Found live Oct 2, 2026: /appeals/advocates and /appeals/care-managers both
// linked "Read the one-page explainer" at
// appeals.casewhy.com/desk/getting-started/link-your-records, which sits behind
// the Desk seat gate and 307s to sign-in. The hub is a PARTNER ACQUISITION
// site — every visitor is by definition someone who does not have an account
// yet, so a seat-gated link is a wall placed exactly where the proof should be.
// Repointed at /for-advocates/how-to#system-of-record, which is public, carries
// advocate chrome, and already contains the same Clio/Salesforce patterns.
//
// /desk and /desk/signin are the legitimate exceptions: they are the front
// doors, and a visitor is meant to arrive at them without an account.
const SEAT_GATED_PREFIXES = ["/desk/getting-started", "/desk/clients", "/desk/cases", "/desk/settings", "/desk/billing", "/desk/resources"];
for (const page of ["/appeals", ...pages.filter((p) => p.line === "appeals").map((p) => p.path)]) {
  const html = read(page);
  if (!html) continue;
  for (const gated of SEAT_GATED_PREFIXES) {
    check(`${page} does not link to the signed-in-only ${gated}`, !html.includes(`appeals.casewhy.com${gated}`));
  }
}

// FOOTER HELP LINKS — one per product line.
//
// Oct 2 audit: the footer's "Get Help" is the immigration attorney/legal-aid
// finder and serves ONLY the USCIS line, but read as product-neutral — which is
// exactly what made the missing Appeals-side contact invisible. It is now
// labelled "USCIS help" and sits beside an Appeals one.
const homeHtml = read("/") ?? "";
check("the footer offers USCIS help, labelled as such", /USCIS help:/.test(homeHtml));
check("the footer offers Appeals help", homeHtml.includes("mailto:appeals-help@casewhy.com"));
check("no footer help link reads as product-neutral", !/>Get Help:/.test(homeHtml));

// SCREENSHOTS STILL PENDING — tracked in CI without being shown to a visitor.
//
// These pages used to RENDER a "PLACEHOLDER — real screenshot to come" caption.
// The Oct 2 site audit caught that a facility decision-maker reading the page
// sees it, and it reads as an apology. Loud-in-CI was the right instinct; a
// public sales page was the wrong place for it. The brief now lives in an HTML
// comment (renders nothing) and is counted here, so the work stays tracked
// while a visitor just sees a page with no image.
const screenshotPages = ["/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/facilities/hospice", "/appeals/care-managers"];
// COUNTED FROM THE SOURCE, NOT THE BUILT PAGE, since 30 Oct 2026 — the
// generator now strips comments on the way out, because 14% of the enterprise
// page was internal commentary and two pages quoted Peter by name in
// view-source. The brief is still an HTML comment and still renders nothing;
// it is simply read where it is written.
//
// THIS NEARLY BECAME A SILENT ZERO. Stripping comments would have made this
// read 0 pending with every screenshot still outstanding, and the check would
// have gone on passing — the count sits in the label, not in the assertion.
//
// COUNTED ACROSS ALL SOURCE MATERIAL RATHER THAN MAPPED PER PAGE. My first fix
// derived a content filename from each page path, which failed immediately:
// `/appeals/facilities/skilled-nursing` has NO content file — that page is
// generated from code — so a per-page mapping either fails on it or needs a
// special case that the next page built from code will not get. The backlog is
// a count of outstanding briefs, and nothing here needs to know which page each
// belongs to.
const briefSources = [
  ...readdirSync(join(ROOT, "scripts/content"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => join(ROOT, "scripts/content", f)),
  join(ROOT, "scripts/generate.mjs"),
];
const pendingShots = briefSources.filter((f) => readFileSync(f, "utf8").includes("SCREENSHOT PENDING"));
// VACUITY, measured in bytes rather than in list length — a full list of files
// nobody opened is how the comment check below passed while reading nothing.
check(
  `the screenshot backlog was read from source (${briefSources.length} files, ${briefSources.reduce((n, f) => n + readFileSync(f, "utf8").length, 0)} bytes)`,
  briefSources.length > 5
);
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
// ---------------------------------------------------------------------------
// THE OFFER IS NEVER TYPED BY HAND.
//
// This used to assert that the pages contained `first ${freeTrialCases} cases
// are free` — a check that tracked the NUMBER while the sentence around it was
// hand-written on every page separately. When the three free cases became
// thirty free days on 28 Oct 2026 the number went to 0 and the check started
// demanding the phrase "first 0 cases are free", which is the guard asking for
// the bug. Peter found the real thing on the live skilled-nursing page:
// *"this does not read right in that spot ... confusing!"*
//
// So it now checks the two things that actually matter.
const offerPages = [
  "/appeals/advocates",
  "/appeals/facilities/skilled-nursing",
  "/appeals/facilities/home-health",
  "/appeals/facilities/hospice",
  "/appeals/attorneys",
  "/appeals/press",
  "/appeals/facilities/nomnc-cheat-sheet",
];

// ONE: the rendered page carries appeals' own sentence, verbatim. Not a
// paraphrase and not a number — the exact string `freePeriodSentence()`
// produced, so a change over there is either reflected here or red here.
let sawOffer = 0;
for (const path of offerPages) {
  const html = read(path);
  if (!html) continue;
  // `&` is the only character in these sentences the generator can transform,
  // and it escapes it. Comparing the raw string would be a check that silently
  // stopped matching the day somebody put "cases & claims" in the offer.
  if (!html.includes(pricingJson.freePeriodSentence.replaceAll("&", "&amp;"))) continue;
  sawOffer += 1;
}
check(`at least four pages state the free period in appeals' own words ("${pricingJson.freePeriodSentence}")`,
  sawOffer >= 4);

// TWO: and nobody writes their own. A content file spelling the offer out is
// how all three of the stale pages came to exist, so the literal is banned at
// source rather than corrected at the end. {{FREE_PERIOD}} is the way in.
//
// IT READS THE CONTENT FILES, NOT THE BUILT PAGES, because the built pages
// legitimately contain the sentence — substituted. Checking the output could
// only ever flag the correct result.
const handWritten = [];
for (const f of readdirSync(join(__dirname, "content"))) {
  if (!f.endsWith(".html")) continue;
  const src = readFileSync(join(__dirname, "content", f), "utf8");
  if (/(?:first|your first)\s+(?:\d+|one|two|three|four|five)\s+cases?\s+(?:are\s+)?free/i.test(src)
      || /\b\d+\s+days?\s+free\b/i.test(src)) {
    handWritten.push(f);
  }
}
check(`no content file writes the free offer out by hand (use {{FREE_PERIOD}})${handWritten.length ? " — " + handWritten.join(", ") : ""}`,
  handWritten.length === 0);

// ---------------------------------------------------------------------------
// A TABLE OR A CARD WITH NO CLASS INHERITS NOTHING, AND SAYS NOTHING ABOUT IT.
//
// Added 1 Nov 2026, after Peter looked at the six new enterprise pages and
// said *"space out the tables and do proper spacing for all pages"*.
//
// WHY IT HAPPENED. The stylesheet styles tables ONLY through `.clock-table`,
// `.price-table` and `.screen`, and styles cards ONLY through `.screen .fig`
// — all deliberately scoped, so that a mock-up of a product screen cannot
// restyle a real content table. The consequence nobody had written down is
// that a bare `<table>` or a bare `<div class="fig">` written in page content
// matches none of them and renders completely unstyled. The generator is
// happy, the verifier was happy, the HTML is valid, and the page is wrong.
//
// So it is caught here, by name: every table in content carries a styling
// class, and no card block uses the `.screen`-scoped names outside a `.screen`.

const unstyledTables = [];
const scopedCards = [];
const TABLE_CLASSES = ["price-table", "clock-table"];

for (const f of readdirSync(join(__dirname, "content"))) {
  if (!f.endsWith(".html")) continue;
  const src = readFileSync(join(__dirname, "content", f), "utf8");

  // A TABLE INSIDE A .screen IS STYLED BY THE MOCK-UP'S OWN RULES, so it is
  // correctly classless. Everything outside one must carry a class.
  //
  // THE RANGES ARE COMPUTED BY DIV DEPTH, not by looking backwards for the
  // nearest "class=\"screen\"" — a nearest-preceding match finds a SIBLING as
  // readily as a parent, which is a mistake this project has made before.
  const screenRanges = [];
  {
    const opens = /<div class="screen"/g;
    let m;
    while ((m = opens.exec(src)) !== null) {
      let depth = 0;
      let i = m.index;
      const tag = /<div\b|<\/div>/g;
      tag.lastIndex = i;
      let t;
      while ((t = tag.exec(src)) !== null) {
        depth += t[0] === "</div>" ? -1 : 1;
        if (depth === 0) break;
      }
      screenRanges.push([m.index, t ? tag.lastIndex : src.length]);
    }
  }
  const insideScreen = (at) => screenRanges.some(([a, b]) => at >= a && at < b);

  for (const m of src.matchAll(/<table\b[^>]*>/g)) {
    if (TABLE_CLASSES.some((c) => m[0].includes(c))) continue;
    if (insideScreen(m.index)) continue;
    unstyledTables.push(`${f}: ${m[0]}`);
  }

  // `.fig`/`.figs` only exist under `.screen`. A content file that is not a
  // screen mock-up and uses them gets no grid and no card — which is exactly
  // how three of these pages shipped to the local preview.
  if (!src.includes('class="screen') && /<div class="figs?\b/.test(src)) {
    scopedCards.push(f);
  }
}

check(`every table in page content carries a styling class${unstyledTables.length ? " — " + unstyledTables.join("; ") : ""}`,
  unstyledTables.length === 0);
check(`no content file uses the .screen-scoped card classes outside a .screen${scopedCards.length ? " — " + scopedCards.join(", ") : ""}`,
  scopedCards.length === 0);

// ---------------------------------------------------------------------------
// THE FACILITY PRIVACY SECTION IS ON ALL THREE FACILITY PAGES.
//
// Peter approved five sentences on Oct 4 2026 (SYNC_0112). They are rendered
// from ONE constant in generate.mjs via {{FACILITY_PRIVACY}}, because his own
// edit to sentence 2 existed to make the wording work for home health and
// hospice as well as skilled nursing — three hand-written copies is three
// chances for one of them to go on saying "resident".
//
// Checked here rather than trusted because a page losing this section loses a
// promise about health information, silently, on the pages the Oct 13 campaign
// points at. The word check is the point: "resident" must not come back.
for (const path of ["/appeals/facilities/skilled-nursing", "/appeals/facilities/home-health", "/appeals/facilities/hospice"]) {
  const html = read(path);
  if (!html) continue;
  check(`${path} carries the facility privacy section`, html.includes("What we store, and what we don"));
  check(`${path} states there is no name field`, html.includes("There is no name field"));
  // THE ACRONYM IS NOW PART OF THE APPROVED WORDING. Peter, 29 Oct 2026: "add
  // (BAA) wherever the full name is reference because it's instant visual
  // recognition." This check failed on all three pages the moment the copy
  // changed, which is exactly its job — the sentence is a promise about health
  // information and must not drift unnoticed. The pin moves in the commit that
  // quotes him, not before.
  //
  // THE ACRONYM IS ASSERTED SEPARATELY from the sentence, so dropping "(BAA)"
  // fails on its own rather than hiding inside a longer string comparison.
  check(`${path} keeps the approved BAA wording`,
    html.includes("no HIPAA business associate agreement (BAA) is needed between us"));
  check(`${path} spells the acronym out beside the full name`,
    html.includes("business associate agreement (BAA)"));
  check(`${path} uses "client", not the SNF-only "resident", in the privacy section`,
    !/We don.t ask for a resident.s name/i.test(html));
}

// ---------------------------------------------------------------------------
// THE FOUNDER STORY ON THE APPEALS LINE IS NOT A PERSONAL FAMILY CLAIM.
//
// Oct 2, 2026 audit, item 8. The Appeals pages claimed Peter built the product
// because his "own family's Medicare letters" were impossible to understand.
// Peter confirmed that is false — it was carried over from the USCIS line, where
// the family story is TRUE, and the build spec had actually asked for it
// verbatim. So correcting the spec is not sufficient protection: the spec was
// the source of the error, and a future rebuild from a future spec could
// reintroduce it the same way.
//
// This check is deliberately asymmetric. It bans the family claim ONLY on the
// Appeals pages, and says nothing about the USCIS pages — /press and /resources
// correctly say Peter's own family's naturalization cases, which is his real
// story and must keep being tellable. A blanket ban on "own family" across the
// site would delete a true claim to protect against a false one.
//
// It also fires on the first-person QUOTE specifically, because that is what
// makes this worse than loose marketing copy: it is attributed to a named real
// person, and /appeals/press is built to be repeated by journalists.
console.log("\n== Appeals-line founder story makes no personal family claim ==");
// THE BAN AND THE PRESERVE HALVES READ DIFFERENT THINGS, DELIBERATELY.
//
// Content files ship verbatim, HTML comments included — the first version of
// this check failed on my own explanatory comment, which carried the banned
// phrase and was being published into the live page source. My first fix was to
// strip comments before matching, and that was wrong: a mutation that hid the
// false claim inside a comment then SURVIVED. A claim in a shipped comment is
// still published, just to anyone who views source.
//
// So the ban reads the RAW bytes — nothing anywhere in what we ship may make the
// claim, comments included. The preserve checks read VISIBLE text only, because
// a true story buried in a comment is not actually being told. (The build note
// that caused all this now lives here in verify.mjs, which ships to nobody.)
const visible = (html) => html.replace(/<!--[\s\S]*?-->/g, "");
// Newline-tolerant: the phrase can wrap across lines in the rendered output, and
// a regex with a literal space would miss it.
const FAMILY_CLAIM = /own family'?s[\s\S]{0,80}?\b(Medicare|denial)/i;
for (const path of ["/appeals", "/appeals/press"]) {
  const html = read(path);
  if (!html) continue;
  check(`${path} does not claim Peter's own family's Medicare letters, anywhere in the shipped source`,
    !FAMILY_CLAIM.test(html));
}
// And the replacement is actually present, not merely the false line removed —
// deleting the paragraph would pass a ban-only check while leaving the page with
// no "why this exists" at all.
const appealsHtml = visible(read("/appeals") ?? "");
check("/appeals still states a why, grounded in the USCIS origin",
  /starting with USCIS case letters/i.test(appealsHtml));
// Word-bounded. Without \b, "1 in 900" satisfies /1 in 9/ — a mutation that
// corrupted the statistic to a nonsense figure passed this check on its first
// run. The anecdote was replaced BY this statistic, so a wrong number here is
// not a cosmetic slip; it is the page's only remaining claim.
check("/appeals keeps the appeal-paradox statistic that replaced the anecdote",
  /\b1 in 9\b/.test(appealsHtml) && /\b8 in 10\b/.test(appealsHtml));
// THE USCIS LINE'S TRUE STORY MUST SURVIVE THIS CHANGE — and this check was
// pointed at the wrong page first. /press is the line-spanning company page;
// the USCIS press kit that actually tells the naturalization story is
// /uscis/press. A ban-plus-preserve pair is only meaningful if the preserve half
// reads the page that really holds the thing being preserved.
const uscisPress = visible(read("/uscis/press") ?? "");
check("/uscis/press still tells the TRUE naturalization family story",
  /own family'?s[\s\S]{0,40}?naturalization/i.test(uscisPress));

// ---------------------------------------------------------------------------
// SEARCH RESULTS — length and uniqueness, read from the BUILT HTML.
//
// Added 21 Oct 2026 with the first SEO pass. Measured that day across the 28
// built pages: 10 titles over 60 characters (worst 90), 8 descriptions over
// 160 (worst 192), and TWO PAIRS byte-identical — skilled-nursing and its
// mid-stay child shared a description, /resources and /uscis/resources shared
// a title. Over-length gets truncated mid-sentence in a result; identical
// gives two real pages a searcher cannot tell apart.
//
// READ FROM THE BUILT FILES, NOT pages.json, for two reasons. The landing
// pages /uscis and /appeals take their tags from `lines[]` rather than
// `pages[]`, so a source-side audit missed them entirely — they were the last
// two over the limit and they are the most valuable pages on the site. And the
// generator decides what actually ships, so checking its input proves the
// wrong thing.
//
// THE DESCRIPTION PARSER IS QUOTE-AWARE ON PURPOSE. A regex shaped
// content=["']([^"']*) stops at the first APOSTROPHE, so the skilled-nursing
// description — "a resident's family" — measured 24 characters instead of 182
// and looked like a truncation bug in the page. It was a bug in the
// measurement. Match the opening delimiter, then only its own closing one.
// ---------------------------------------------------------------------------
// NO PAGE SHIPS WITH AN UNSUBSTITUTED TOKEN.
//
// Found by mutating the guard above: deleting one `replaceAll` line in the
// generator put a literal `{{FREE_PERIOD}}` on three live pages — including
// the NOMNC cheat sheet, where it is the link text of the call to action — and
// every check still passed, because the pages that DO carry the sentence come
// from the pricing table rather than the token.
//
// A missing substitution is the one template failure that is both invisible to
// the build and glaring to a reader, so it is checked on the OUTPUT, where the
// only correct number of tokens is zero.
{
  const leaked = [];
  for (const file of builtPages()) {
    const html = readFileSync(file, "utf8");
    for (const m of new Set([...html.matchAll(/\{\{[A-Z][A-Z_:]*\}\}/g)].map((x) => x[0]))) {
      leaked.push(`${file.slice(ROOT.length)} ${m}`);
    }
  }
  check(`no built page carries an unsubstituted {{TOKEN}}${leaked.length ? " — " + leaked.join(", ") : ""}`,
    leaked.length === 0);
}

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

function builtPages(dir = ROOT, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["node_modules", "scripts", "images"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) builtPages(full, found);
    else if (entry.name === "index.html") found.push(full);
  }
  return found;
}

function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function descriptionOf(html) {
  const tag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  if (!tag) return null;
  const d = tag[0].match(/content="([^"]*)"/) || tag[0].match(/content='([^']*)'/);
  return d ? d[1] : null;
}

console.log("\n== Search results: length and uniqueness ==");
{
  const built = builtPages();
  // An empty sweep must not read as a clean one.
  check(`the SEO scan found pages to read (${built.length})`, built.length > 20);

  const longTitles = [];
  const longDescs = [];
  const missing = [];
  const byTitle = new Map();
  const byDesc = new Map();

  for (const file of built) {
    const html = readFileSync(file, "utf8");
    const rel = file.slice(ROOT.length).replace(/\/index\.html$/, "") || "/";
    const title = titleOf(html);
    const desc = descriptionOf(html);
    if (!title || !desc) missing.push(rel);
    if (title) {
      if (title.length > SEO_TITLE_MAX) longTitles.push(`${rel} (${title.length})`);
      byTitle.set(title, [...(byTitle.get(title) ?? []), rel]);
    }
    if (desc) {
      if (desc.length > SEO_DESC_MAX) longDescs.push(`${rel} (${desc.length})`);
      byDesc.set(desc, [...(byDesc.get(desc) ?? []), rel]);
    }
  }

  const dupTitles = [...byTitle.values()].filter((v) => v.length > 1);
  const dupDescs = [...byDesc.values()].filter((v) => v.length > 1);

  check(`every page has a title and a description${missing.length ? ` — missing on ${missing.join(", ")}` : ""}`,
    missing.length === 0);
  check(`no title over ${SEO_TITLE_MAX} chars${longTitles.length ? ` — ${longTitles.join(", ")}` : ""}`,
    longTitles.length === 0);
  check(`no description over ${SEO_DESC_MAX} chars${longDescs.length ? ` — ${longDescs.join(", ")}` : ""}`,
    longDescs.length === 0);
  // Uniqueness is the half a length check cannot see: two pages can both be
  // comfortably short and still be indistinguishable in a result.
  check(`no two pages share a title${dupTitles.length ? ` — ${dupTitles.map((v) => v.join(" = ")).join("; ")}` : ""}`,
    dupTitles.length === 0);
  check(`no two pages share a description${dupDescs.length ? ` — ${dupDescs.map((v) => v.join(" = ")).join("; ")}` : ""}`,
    dupDescs.length === 0);
}

// ---- a page that ships is a page the sitemap offers ----
//
// THE CHECK ABOVE IT ASKS THIS QUESTION FOR ONE HARDCODED PATH, and that is
// why it missed the page that needed it. The families check asserts
// `sitemap.xml.includes("/appeals/families")` by name, so it can only ever
// catch the one page somebody already thought about.
//
// Measured 22 Oct 2026: 28 pages on disk, 27 in sitemap.xml. The missing one
// was /appeals/facilities/nomnc-cheat-sheet — a free lead magnet, live since
// 8 Oct, committed as a hand-written index.html that was in NO registry. The
// sitemap is generated from pages.json, so a page outside pages.json is
// invisible to it by construction, and nothing noticed for two weeks. It had
// also silently fallen a shared script behind every generated page.
//
// WALK THE DISK, NOT THE REGISTRY. A registry-vs-sitemap check is a tautology
// here — both come from pages.json, so it would have been green throughout.
// The disk is where the discrepancy lives.
//
// DRAFTS ARE THE ONE LEGITIMATE ABSENCE, and the exemption reads the flag from
// pages.json rather than listing paths, so approving a draft (dropping the
// flag) automatically brings it under this rule. A non-draft page whose URL is
// published and unlisted has no honest reason to exist: either it is for
// readers, in which case search should have it, or it is not, in which case it
// should be a draft.
console.log("\n== Every shipped page is in the sitemap ==");
{
  const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const draftPaths = new Set([...lines, ...pages, ...companyPages].filter((p) => p.draft).map((p) => p.path));
  const built = builtPages().map((f) => f.slice(ROOT.length).replace(/\/index\.html$/, "") || "/");
  check(`the sweep found pages to check (${built.length})`, built.length > 20);

  const unlisted = built.filter((rel) => !draftPaths.has(rel) && !sitemap.includes(`<loc>https://casewhyhub.com${rel}</loc>`));
  check(
    `every non-draft page is offered in sitemap.xml${unlisted.length ? ` — missing: ${unlisted.join(", ")}` : ""}`,
    unlisted.length === 0
  );
  // And the inverse, which fails the other way round: the sitemap must not
  // advertise a URL that does not exist. A 404 in a sitemap is a crawl budget
  // spent on nothing, and it is how a renamed path goes unnoticed.
  const builtSet = new Set(built);
  const phantom = [...sitemap.matchAll(/<loc>https:\/\/casewhyhub\.com([^<]*)<\/loc>/g)]
    .map((m) => m[1] || "/")
    .filter((rel) => !builtSet.has(rel));
  check(
    `the sitemap offers no URL without a page${phantom.length ? ` — ${phantom.join(", ")}` : ""}`,
    phantom.length === 0
  );
}

// ---------------------------------------------------------------------------
// NO INTERNAL COMMENTARY SHIPS TO A READER.
//
// Measured 30 Oct 2026, before `stripComments` existed: the enterprise page
// carried 9 HTML comments — 8,408 of its 56,214 bytes, 14% of the page — and
// two pages quoted Peter by name. One of them explained that the copy above it
// had been wrong until that morning. All of it was readable in view-source on a
// public marketing site.
//
// The comments themselves are worth keeping in the content files: that is where
// a later session finds out why a sentence is worded the way it is. This checks
// the OUTPUT, which is the only place it mattered.
{
  // `builtPages()` RETURNS ABSOLUTE FILE PATHS, not relative page paths. The
  // first version of this block treated them as page paths and rebuilt each one
  // as ROOT + path + "index.html" — which existed for none of them, so every
  // file was filtered out and the check passed while reading nothing. It passed
  // with nine comments sitting in the page it was supposed to be looking at.
  //
  // That is the second time in one day: the staleness check above had the same
  // shape, looking pages up by a key they are not keyed on.
  //
  // SO THE VACUITY GUARD COUNTS BYTES READ, NOT PAGES LISTED. The broken version
  // had a vacuity guard and it passed too, because the list was full — it was
  // the reading that was empty, and a list length cannot tell you that.
  const pageFiles = builtPages();
  let bytesRead = 0;
  const leaking = [];
  for (const f of pageFiles) {
    const html = readFileSync(f, "utf8");
    bytesRead += html.length;
    if (html.includes("<!--")) leaking.push(f.replace(ROOT, ""));
  }
  check(`the comment check actually read the pages (${pageFiles.length} files, ${bytesRead} bytes)`,
    pageFiles.length > 5 && bytesRead > 100_000);
  check(
    `no built page ships an HTML comment${leaking.length ? ` — ${leaking.slice(0, 3).join(", ")}` : ""}`,
    leaking.length === 0
  );

  // AND THE STRIP MUST NOT BE ABLE TO EAT A CODE SAMPLE. Nothing on this site
  // displays markup today — 0 <pre>/<code> blocks contain a comment marker — so
  // the strip is safe. If a page ever shows an HTML example, this fails here
  // rather than silently deleting part of it.
  const sources = readdirSync(join(ROOT, "scripts/content")).filter((f) => f.endsWith(".html"));
  const risky = sources.filter((f) => {
    const src = readFileSync(join(ROOT, "scripts/content", f), "utf8");
    return [...src.matchAll(/<(pre|code)\b[\s\S]*?<\/\1>/g)].some((m) => m[0].includes("<!--"));
  });
  check(
    `no page displays markup that the comment strip would eat${risky.length ? ` — ${risky.join(", ")}` : ""}`,
    risky.length === 0
  );
}

// ---------------------------------------------------------------------------
// EMPHASIS TAGS BALANCE, AND NONE NESTS.
//
// Added 30 Oct 2026 after I broke it. Replacing a bold phrase on the
// enterprise page, I wrote `<strong>` inside an existing `<strong>` and
// consumed its closing tag — leaving the outer one unclosed, which bolds the
// rest of the list item. This file passed before the mistake and after it,
// because nothing here looked at the markup.
//
// It matters beyond tidiness: a pinned decision allows bold on SIX phrases
// only, and an unclosed tag silently bolds whatever follows. The violation
// would have been visible on the page and invisible to every check.
{
  const pages = builtPages();
  let read = 0;
  const broken = [];
  for (const f of pages) {
    const html = readFileSync(f, "utf8");
    read += html.length;
    for (const tag of ["strong", "em", "b", "i"]) {
      const open = (html.match(new RegExp(`<${tag}>`, "g")) ?? []).length;
      const close = (html.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
      if (open !== close) broken.push(`${f.replace(ROOT, "")}: ${open} <${tag}> vs ${close} </${tag}>`);
      if (new RegExp(`<${tag}>[^<]*<${tag}>`).test(html)) broken.push(`${f.replace(ROOT, "")}: nested <${tag}>`);
    }
  }
  // Vacuity in bytes, not in list length — the lesson from the comment check.
  check(`the markup check read the pages (${pages.length} files, ${read} bytes)`, pages.length > 5 && read > 100_000);
  check(
    `emphasis tags balance and do not nest${broken.length ? ` — ${broken.slice(0, 3).join("; ")}` : ""}`,
    broken.length === 0
  );
}

// ---------------------------------------------------------------------------
// THE PORTFOLIO BANDS ON THE PAGE ARE THE ONES IN THE PRICE BOOK.
//
// Every figure in that table is DERIVED — $499 at 15% off is $424 — so a
// hand-typed $424 survives a change to $499 and nobody sees it. The table is
// rendered from pricing.json through {{PORTFOLIO_PRICING}}; this fails the
// build if somebody replaces the token with literals, which is the only way
// the two can come apart.
{
  // THE PRICING MOVED TO ITS OWN PAGE, 1 Nov 2026. Peter: *"this is too much
  // for one page ... provide short multi-pages focusing on single topic per
  // page"*, then *"build the 6 pages"*.
  //
  // These checks exist because a published price that drifts from the price the
  // product charges is the worst kind of stale copy — and the $499 line went
  // wrong once already. They were pinned to /appeals/enterprise because that is
  // where the table was. It is now /appeals/enterprise/pricing, so they read
  // that page.
  //
  // THE OVERVIEW IS CHECKED TOO, for the opposite property: it must NOT carry
  // the figures. A price in two places is a price that drifts in one of them,
  // which is exactly what splitting the page could have caused.
  const page = read("/appeals/enterprise/pricing");
  check("the enterprise pricing page exists to check", page !== null);

  // -------------------------------------------------------------------------
  // NO CONTENT FILE TYPES A PRICE THE PRICE BOOK OWNS.
  //
  // Added 1 Nov 2026, because the check below it — "the overview carries NO
  // price" — was scoped to ONE page, and the enterprise pricing page I wrote
  // the same day hand-typed all seventeen portfolio figures plus a worked
  // example and passed every check in this file.
  //
  // THE FIGURES ARE DERIVED, WHICH IS WHY TYPING THEM IS THE BUG: $499 at 15%
  // off is $424, so a hand-typed $424 survives a change to $499 and nobody
  // sees it. generate.mjs has warned about this in prose twice. Prose does not
  // fail a build.
  //
  // SCOPED TO THE PORTFOLIO PER-SITE FIGURES ($129-$499) ON PURPOSE. The
  // per-case rates are small numbers — 12, 15, 16, 19, 20, 25 — and matching
  // those against arbitrary page copy produces false positives faster than it
  // produces findings, which is how a guard gets switched off.
  //
  // COMMENTS ARE STRIPPED FIRST. appeals-facilities-hospice.html quotes Peter
  // saying "Hospice $199 unlimited cases" in a comment explaining why the
  // prices are NOT typed there. Flagging that file would have been exactly
  // backwards.
  const portfolioFigures = new Set();
  for (const b of (pricingJson.portfolio?.bands ?? [])) {
    for (const seg of Object.keys(b.perSiteUsd ?? {})) portfolioFigures.add(b.perSiteUsd[seg]);
  }
  const typedPrices = [];
  for (const f of readdirSync(join(__dirname, "content"))) {
    if (!f.endsWith(".html")) continue;
    const src = readFileSync(join(__dirname, "content", f), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const hits = [...src.matchAll(/\$([0-9][0-9,]*)/g)]
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => portfolioFigures.has(n));
    if (hits.length) typedPrices.push(f + " (" + [...new Set(hits)].map((n) => "$" + n).join(", ") + ")");
  }
  check(
    `no content file types a portfolio price by hand${typedPrices.length ? " — " + typedPrices.join("; ") : ""}`,
    typedPrices.length === 0,
    "use {{PORTFOLIO_PRICING}} or {{PRICING_CALCULATOR}} — a derived figure typed by hand goes stale in silence",
  );

  // -------------------------------------------------------------------------
  // THE CALCULATOR ACTUALLY COMPUTES THE RIGHT NUMBER.
  //
  // Added 1 Nov 2026 with the calculator itself. The arithmetic was checked by
  // driving the rendered page in a browser against portfolioQuote() in the
  // appeals repo — twelve scenarios, all matching — but that was a one-off in
  // a console. A one-off is not a test: it cannot fail tomorrow.
  //
  // So the rule is extracted from the BUILT PAGE and run here. Not a second
  // copy of the rule, and not the source file — the bytes that ship. If the
  // function or its fences are renamed the extraction fails and so does this
  // check, which is the behaviour a silently-skipping test cannot give you.
  //
  // THE CASES ARE THE BAND EDGES AND THE ONE RULE A READER WILL TEST US ON:
  // every boundary read out of the price book, and non-profit locations
  // neither priced nor counted toward the band.
  {
    const built = read("/appeals/enterprise/pricing");
    // THE MATCH STARTS AT THE "//", not at the dashes. Starting mid-comment
    // captured a first line that was not a comment, so the comment filter
    // below left it in and the extracted body would not parse.
    const fence = built && built.match(/\/\/ ---- QUOTE RULE[\s\S]*?---- END QUOTE RULE ----/);
    check(
      "the calculator quote rule can be found in the built page",
      Boolean(fence),
      "the fence comments are how this test finds the rule — renaming them would disable it",
    );

    if (fence) {
      const body = fence[0]
        .split("\n")
        .filter((l) => !l.trim().startsWith("//"))
        .join("\n");
      let quoteFn = null;
      try {
        quoteFn = new Function(body + "; return quote;")();
      } catch (err) {
        check("the extracted quote rule parses", false, String(err && err.message));
      }
      if (typeof quoteFn === "function") {
        const bands = pricingJson.portfolio.bands;
        const book = { bands };
        const fails = [];
        const one = (counts, np, wantTotal, wantPaid, wantDiscount, why) => {
          const q = quoteFn(book, counts, np);
          if (q.total !== wantTotal || q.paid !== wantPaid || q.band.discountPercent !== wantDiscount) {
            fails.push(
              why + ": got total " + q.total + " / paid " + q.paid + " / discount " +
              q.band.discountPercent + ", wanted " + wantTotal + " / " + wantPaid + " / " + wantDiscount,
            );
          }
        };

        // EVERY BAND EDGE, derived from the book so a new band is covered too.
        for (const b of bands) {
          const lo = b.minFacilities > 0 ? b.minFacilities : 1;
          one({ snf: lo }, 0, b.perSiteUsd.snf * lo, lo, b.discountPercent,
            "band " + b.id + " at its lower edge of " + lo);
          if (b.maxFacilities !== null) {
            one({ snf: b.maxFacilities }, 0, b.perSiteUsd.snf * b.maxFacilities, b.maxFacilities,
              b.discountPercent, "band " + b.id + " at its upper edge of " + b.maxFacilities);
          }
        }

        // THE BAND COUNTS ACROSS CARE SETTINGS, not within one of them.
        const tier1 = bands.find((b) => b.discountPercent > 0);
        if (tier1) {
          const n = tier1.minFacilities;
          one({ snf: n - 1, hospice: 1 }, 0,
            tier1.perSiteUsd.snf * (n - 1) + tier1.perSiteUsd.hospice, n, tier1.discountPercent,
            "a mixed portfolio reaching " + n + " earns the band");

          // NON-PROFIT: NOT PRICED, AND NOT COUNTED. The second half is the one
          // that would be invisible in the output — it shows up only as a
          // discount nobody earned.
          const paidN = tier1.minFacilities - 1;
          one({ snf: paidN }, 50, bands[0].perSiteUsd.snf * paidN, paidN, 0,
            paidN + " paid plus 50 non-profit must stay at standard rates");
        }
        one({ snf: 0 }, 12, 0, 0, 0, "non-profit only is not priced at all");

        check(
          "the calculator agrees with the price book at every band edge and on the non-profit rule" +
            (fails.length ? " — " + fails.slice(0, 3).join("; ") : ""),
          fails.length === 0,
        );

        // ---- THE POOLED LADDER, PINNED TO THE AUTHORITATIVE ANSWERS -------
        //
        // Peter, 5 Nov 2026: "fix the chains pricing to per-case not
        // per-site". The calculator above is a hand-written SECOND
        // implementation of portfolioQuote() in the appeals repo, and the
        // pooled price needs graduated bands plus largest-remainder
        // apportionment across the care settings — enough arithmetic to drift
        // without anybody noticing. A marketing calculator that quotes a
        // figure we will not honour is worse than no calculator.
        //
        // So the appeals repo exports `pooledCases.checkpoints`: case mixes
        // with the answer computed by the real implementation. This build
        // fails if the copy disagrees with any of them. The checkpoints are
        // chosen to bite — single band, both band seams, a mix whose
        // proportional shares do not divide evenly, the deepest band, and a
        // setting with no cases beside two that have some.
        //
        // IT IS NOT A SELF-TEST: both sides are compared, and the expected
        // values come from the other repo, so no amount of editing this file
        // can make a wrong calculator pass.
        const pooled = pricingJson.portfolio.pooledCases;
        check(
          "pricing.json carries the pooled ladder and its checkpoints",
          Boolean(pooled && pooled.bands && pooled.bands.length && pooled.checkpoints && pooled.checkpoints.length),
          "without them the calculator's pooled arithmetic is unverified",
        );
        if (pooled && pooled.checkpoints && pooled.bands) {
          const book2 = { bands, pooledCases: pooled, minimumFacilities: pricingJson.portfolio.minimumFacilities };
          const drift = [];
          for (const cp of pooled.checkpoints) {
            // ONE CASE PER LOCATION, so the location counts ARE the case
            // counts and the checkpoint's mix is reproduced exactly. The
            // calculator multiplies locations by cases-per-location, so this
            // is the only input shape that can express an arbitrary mix.
            const counts = { snf: cp.cases.snf, home_health: cp.cases.home_health, hospice: cp.cases.hospice };
            const q = quoteFn(book2, counts, 0, 1);
            // The license cap can legitimately undercut the pooled figure at
            // these shapes, so the POOLED number is what is compared — the cap
            // has its own check below.
            if (q.pooled !== cp.monthlyUsd) {
              drift.push(
                `snf ${cp.cases.snf}/hh ${cp.cases.home_health}/hospice ${cp.cases.hospice}: ` +
                  `calculator $${q.pooled}, authoritative $${cp.monthlyUsd}`,
              );
            }
          }
          check(
            "the calculator reproduces every pooled checkpoint from the appeals repo" +
              (drift.length ? " — " + drift.slice(0, 3).join("; ") : ""),
            drift.length === 0,
            "the hub's copy of the pooled arithmetic has drifted from the real one",
          );

          // THE CAP IS A PROMISE ON THE PAGE, so it is asserted rather than
          // assumed: a busy portfolio must never be quoted above the license.
          const heavy = quoteFn(book2, { snf: 40 }, 0, 80);
          check(
            "a very busy portfolio is quoted the license, never above it",
            heavy.total <= heavy.license && heavy.cappedOut === true,
            `got ${heavy.total} against a license of ${heavy.license}`,
          );
          // AND THE CAP MUST NOT BIND AT ORDINARY VOLUME, or the whole change
          // achieves nothing. 10 cases a building is the measured median.
          const typical = quoteFn(book2, { snf: 40 }, 0, 10);
          check(
            "at the median 10 cases a building the pooled price wins by a wide margin",
            typical.cappedOut === false && typical.total < typical.license * 0.6,
            `got ${typical.total} against a license of ${typical.license}`,
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // THE CALCULATOR MUST ACTUALLY RUN AND PRODUCE A FIGURE.
  //
  // THIS EXISTS BECAUSE IT SHIPPED DEAD. On 5 Nov 2026 the per-case rewrite put
  // an em dash OUTSIDE a JavaScript string instead of escaping it inside, so
  // the whole inline script failed to parse and the calculator did nothing on
  // the live page. Peter found it: *"on th hub ... the calc is doing nothing"*.
  //
  // EVERY EXISTING CHECK PASSED — twenty-four of them — because the quote-rule
  // test EXTRACTS the pure function between the fence comments and runs that
  // alone. The function was fine. The surrounding script, the render path and
  // the DOM wiring were never executed by anything, so "the arithmetic is
  // right" was being read as "the page works".
  //
  // So this evaluates the WHOLE script against a minimal DOM stub and asserts a
  // figure comes out. It is the cheapest possible stand-in for opening the page,
  // and it would have caught a bare syntax error, a missing element id, a
  // renamed input, and a throw inside render().
  //
  // THE STUB IS DELIBERATELY DUMB. It implements only what the script touches,
  // so if the script starts needing more of the DOM this check fails and says
  // so rather than silently covering less than it claims.
  {
    const built = read("/appeals/enterprise/pricing");
    const scripts = built
      ? [...built.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
          .filter((m) => !/src=|json/i.test(m[1]))
          .map((m) => m[2])
      : [];
    const calcScript = scripts.find((b) => b.includes("calc-form"));
    check(
      "the pricing page carries a calculator script to run",
      Boolean(calcScript),
      "no inline script mentions calc-form — the calculator markup or its script is gone",
    );

    if (calcScript) {
      // THE STUB'S IDS COME FROM THE PAGE, NOT FROM THIS FILE — and the first
      // version got that wrong. It handed the script a hardcoded list of ids,
      // so renaming an input in the markup left the stub still answering to the
      // old name and the check passed. Found by mutation the same hour: a
      // renamed `calc-cases` input was invisible, which on the live page means
      // the field reads zero for ever and the figure silently stops responding.
      //
      // Now the ids are parsed out of the rendered form. If the script asks for
      // something the page does not contain, `missing` catches it; if the page
      // grows an input the script ignores, the figure below still has to come
      // out right.
      const formIds = [...(built.match(/<input[^>]*\bid="(calc-[a-z-]+)"/g) ?? [])]
        .map((tag) => (tag.match(/id="(calc-[a-z-]+)"/) ?? [])[1])
        .filter(Boolean);
      check(
        `the calculator form has its inputs in the markup (found ${formIds.length})`,
        formIds.length >= 4,
        "with no inputs parsed, the stub below would prove nothing about the real page",
      );
      // A plausible footprint: a mid-size mixed portfolio at the measured
      // median volume. Per-setting counts are matched by name so this does not
      // depend on the order the fields happen to be rendered in.
      const valueFor = (id) =>
        /snf/.test(id) ? "40" : /hha|home/.test(id) ? "12" : /hospice/.test(id) ? "8"
        : /nonprofit/.test(id) ? "0" : /cases/.test(id) ? "10" : "0";
      const elements = {};
      for (const id of formIds) elements[id] = { value: valueFor(id) };
      const out = { innerHTML: "" };
      let listeners = 0;
      const missing = [];
      const documentStub = {
        getElementById(id) {
          if (id === "calc-out") return out;
          if (id === "calc-form") return { addEventListener: () => { listeners++; } };
          if (elements[id]) return elements[id];
          missing.push(id);
          return null;
        },
      };

      let threw = null;
      try {
        // eslint-disable-next-line no-new-func
        new Function("document", calcScript)(documentStub);
      } catch (err) {
        threw = err && err.message ? err.message : String(err);
      }
      check(
        "the calculator script runs without throwing" + (threw ? ` — ${threw}` : ""),
        threw === null,
        "a syntax error or a throw here means the live calculator does nothing at all",
      );
      check(
        "it wired itself to the form",
        listeners > 0,
        "nothing listened for input, so typing a footprint would change nothing",
      );
      check(
        "it asked for no element the page does not have" + (missing.length ? ` — ${[...new Set(missing)].join(", ")}` : ""),
        missing.length === 0,
        "a renamed or removed input id leaves the calculator reading zero for ever",
      );

      // AND THE FIGURE MUST BE THE RIGHT ONE. "It rendered something" would
      // pass on an error message, so this pins the actual arithmetic for a
      // known footprint against pricing.json rather than against a literal.
      // THE FIGURE MUST BE THE RIGHT ONE, AND MY FIRST VERSION OF THIS CHECK
      // PASSED ON A WRONG ONE. 6 Nov 2026.
      //
      // It asserted `/\$[\d,]+/.test(html)` and `html.includes("600")` — that
      // SOME dollar amount appeared, and that the number 600 appeared. On the
      // live page the calculator was quoting "$0", because the pooled ladder was
      // never put in the object it is handed. "$0" matches a dollar amount, and
      // 600 was the pooled CASE COUNT, so both halves passed while the page told
      // a reader their portfolio was free. Peter found it; this check did not.
      //
      // IT IS NOW PINNED TO THE AUTHORITATIVE ANSWER. `pooledCases.checkpoints`
      // is computed by the real implementation in the appeals repo, so the
      // expected total cannot be derived from the thing under test. A zero, a
      // stale ladder, or a missing one all fail with the figure named.
      const html = String(out.innerHTML);
      const cp = (pricingJson.portfolio.pooledCases.checkpoints ?? []).find(
        (c) => c.cases.snf === 400 && c.cases.home_health === 120 && c.cases.hospice === 80,
      );
      check(
        "there is an authoritative checkpoint for the shape this stub prices",
        Boolean(cp),
        "without it the figure below would be compared against nothing",
      );
      if (cp) {
        const want = `$${cp.monthlyUsd.toLocaleString("en-US")}`;
        check(
          `it produced the right monthly figure for 40 SNF + 12 HH + 8 hospice at 10 cases each (${want})`,
          html.includes(want),
          `expected ${want} — the figure the appeals repo computes for this pool — got ` +
            `${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200) || "(nothing at all)"}`,
        );
        check(
          "and it is not quoting zero",
          !/\$0\b/.test(html),
          "a $0 portfolio price is what the missing pooled ladder produced, and it read as free",
        );
      }
      const pooledBands = pricingJson.portfolio.pooledCases.bands;
      check(
        "and it names the per-case rate rather than only a total",
        html.includes(`$${pooledBands[0].perCaseUsd.snf}`) || /a case/.test(html),
        "the blended per-case rate is the number a reader checks against what they pay today",
      );
    }
  }

  // -------------------------------------------------------------------------
  // THE SIX FAMILY PRICES COME FROM THE EXPORT, NOT FROM THE PAGE.
  //
  // Peter, 6 Nov 2026: *"famil pricing not updated on the hub"*. The families
  // page had six HAND-TYPED prices, so when the appeals packs moved on 5 Nov
  // ($49 -> $39, $39 -> $29) this page went on publishing the old ones to
  // families deciding whether to pay.
  //
  // The export had existed since 14 October, writing a file headed "GENERATED —
  // do not edit by hand" that no page ever read: the decision about which
  // repository it landed in was left open and never made. A producer with no
  // consumer reads as finished, which is why nothing complained for three weeks.
  //
  // WHAT THIS ASSERTS, in both directions:
  //   * the content file contains no price literal at all — the next person to
  //     "just update the number" is stopped, which is the failure that happened
  //   * every price in the export appears on the rendered page
  //   * the count matches, so a coverage type added in the appeals repo and not
  //     linked here fails rather than being quietly absent
  {
    const familiesSrc = readFileSync(join(__dirname, "content", "appeals-families.html"), "utf8");
    // EITHER A TOKEN OR A LITERAL THAT MATCHES THE EXPORT — and the reason is a
    // conflict I created and then found, 6 Nov 2026.
    //
    // This first demanded NO price literal at all, because the six prices on
    // this page had been hand-typed and went stale when Peter moved the family
    // ladder down. Tokens fixed that here.
    //
    // BUT THE APPEALS REPO ALREADY GENERATES THIS FILE, at this exact path, with
    // LITERAL prices read from the packs — "Prices: read from each pack's
    // priceUsd, never hand-typed" — and its own test fails when the generated
    // copy drifts. The intended flow is that somebody copies that file here.
    // Under my no-literals rule, doing so would have removed the tokens and
    // tripped this check, so the two mechanisms were fighting.
    //
    // THE TWO COPIES HAVE ALSO GENUINELY DIVERGED: this one carries hub-only
    // content the generator does not know about, including a note on why the
    // ombudsman clause is deliberately absent. Copying the generated file over
    // would lose that, so reconciling them is a decision rather than a
    // clean-up, and it is not made here.
    //
    // So the rule becomes the one that holds either way: a price on this page
    // must be one the export knows. A token resolves to one by construction; a
    // literal is checked against the export below. What is still forbidden is a
    // number that is nobody's price.
    const literals = [...familiesSrc.matchAll(/class="card-price">\s*\$(\d+)/g)].map((m) => Number(m[1]));
    const exportedPrices = new Set(familiesPricing.coverageTypes.map((c) => c.priceUsd));
    const unknownLiterals = [...new Set(literals.filter((n) => !exportedPrices.has(n)))];
    check(
      "every price typed on the families page is one the export knows" +
        (unknownLiterals.length ? ` — found $${unknownLiterals.join(", $")}` : ""),
      unknownLiterals.length === 0,
      "a hand-typed price the export does not contain is the drift that went stale once already",
    );

    // COUNTED BY THE CARD'S LINK, NOT BY THE PRICE TOKEN. It counted tokens
    // until 6 Nov 2026, which made the check fail the moment a price was a
    // LITERAL instead — and a literal is exactly what the appeals repo's
    // generator emits for this page. The count would then have been wrong for
    // the supported case while saying nothing about the cards.
    //
    // Every card links to its own coverage path, in both forms, so that is what
    // identifies a card.
    const exported = familiesPricing.coverageTypes;
    const carded = exported.filter((c) =>
      new RegExp(`appeals\\.casewhy\\.com/${c.slug}\\b`).test(familiesSrc),
    );
    const uncarded = exported.filter((c) => !carded.includes(c)).map((c) => c.slug);
    check(
      `every coverage type in the export has a card (${carded.length} of ${exported.length})` +
        (uncarded.length ? ` — missing ${uncarded.join(", ")}` : ""),
      carded.length === exported.length,
      "a coverage type priced in the appeals repo but not listed here is an appeal families cannot find",
    );

    const familiesPage = read("/appeals/families");
    check("the families page exists to check", familiesPage !== null);
    if (familiesPage) {
      const missing = exported
        .filter((c) => !familiesPage.includes(`$${c.priceUsd}`))
        .map((c) => `${c.slug} $${c.priceUsd}`);
      check(
        "every exported family price is on the page" + (missing.length ? ` — missing ${missing.join(", ")}` : ""),
        missing.length === 0,
      );
      // AND NO PRICE THAT IS NOT OURS. A leftover figure from a previous
      // ladder is the shape of staleness a reader notices and we do not: the
      // page still renders, and the number is simply wrong.
      const ours = new Set(exported.map((c) => c.priceUsd));
      const cardPrices = [...familiesPage.matchAll(/class="card-price">\s*\$(\d+)/g)].map((m) => Number(m[1]));
      const stray = [...new Set(cardPrices.filter((n) => !ours.has(n)))];
      check(
        "no card shows a price that is not in the export" + (stray.length ? ` — $${stray.join(", $")}` : ""),
        stray.length === 0,
      );
    }
  }

  // -------------------------------------------------------------------------
  // EVERY DOLLAR FIGURE ON EVERY APPEALS PAGE IS ONE WE ACTUALLY CHARGE.
  //
  // Peter, 6 Nov 2026: *"check and double all the prices on th HUB"*. The audit
  // that answered him found nothing stale — and the reason to keep it is that
  // it only found nothing because somebody ran it. The four things it HAD
  // caught in the preceding hour were each found by a person reading a page:
  // a dead calculator, a dated plan card, a stale ceiling table, and six
  // hand-typed family prices. Reading pages does not scale and does not repeat.
  //
  // HOW IT WORKS. Both exports describe everything the product charges, so any
  // other figure rendered to a reader is either a non-price (a statistic, a
  // figure from a cited rule) or a mistake. The allow-list of non-prices is
  // short and each entry says what it is, so a new unexplained figure fails
  // rather than joining a vague exception.
  //
  // WHAT IT DELIBERATELY DOES NOT CHECK. That each figure sits in a TRUE
  // SENTENCE — "$25 a case for the first 5 each month" uses a real price and
  // would still be wrong if the band were 25. Only a reader catches that, which
  // is why the staleness Peter found was in prose and not in the numbers. This
  // check covers the half that can be mechanised; it does not pretend to cover
  // the other.
  {
    const CHARGED = new Map();
    const noteFigure = (n, what) => {
      if (!(n > 0)) return;
      if (!CHARGED.has(n)) CHARGED.set(n, new Set());
      CHARGED.get(n).add(what);
    };
    for (const [lane, plans] of Object.entries(pricingJson.lanes)) {
      for (const plan of plans) {
        noteFigure(plan.monthlyUsd, `${lane}/${plan.id} monthly`);
        for (const t of plan.tiers ?? []) noteFigure(t.perCaseUsd, `${lane}/${plan.id} per case`);
      }
    }
    for (const b of pricingJson.portfolio.bands ?? []) {
      for (const [seg, v] of Object.entries(b.perSiteUsd ?? {})) noteFigure(v, `portfolio ${b.id} ${seg}`);
    }
    for (const b of pricingJson.portfolio.pooledCases?.bands ?? []) {
      for (const [seg, v] of Object.entries(b.perCaseUsd ?? {})) noteFigure(v, `pooled ${b.label} ${seg}`);
    }
    for (const c of familiesPricing.coverageTypes) noteFigure(c.priceUsd, `family ${c.slug}`);

    // NOT OUR PRICES, AND EACH ONE SAYS WHY. Adding to this list is a claim
    // that a figure is not a price; leaving it vague is how a stale price hides
    // in an exception.
    const NOT_A_PRICE = new Map([
      ["1,960", "the CMS/MA figure quoted in the appeal packs"],
      ["200", "a dollar amount inside a cited rule"],
      ["300", "a dollar amount inside a cited rule"],
      ["38.99", "the 2026 Part D national base beneficiary premium"],
      ["0", "free — no monthly fee"],
    ]);

    const stray = [];
    let figures = 0;
    let pagesScanned = 0;
    for (const route of ["/appeals", ...pages.filter((pg) => pg.line === "appeals").map((pg) => pg.path)]) {
      const html = read(route);
      if (!html) continue;
      pagesScanned++;
      // THE INLINE SCRIPTS ARE STRIPPED because they carry the price BOOK, not
      // a claim to a reader — the calculator's own figures are checked by
      // running it. Comments are stripped for the same reason: they are notes.
      const text = html
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/g, " ")
        .replace(/\s+/g, " ");
      for (const m of text.matchAll(/\$([\d,]+(?:\.\d+)?)/g)) {
        figures++;
        const raw = m[1];
        const n = Number(raw.replace(/,/g, ""));
        if (CHARGED.has(n) || NOT_A_PRICE.has(raw) || NOT_A_PRICE.has(String(n))) continue;
        stray.push(`${route}: $${raw} — "…${text.slice(Math.max(0, m.index - 45), m.index + 35).trim()}…"`);
      }
    }

    check(
      `every dollar figure on the appeals pages is a price we charge (${figures} figures on ${pagesScanned} pages)` +
        (stray.length ? ` — ${stray.slice(0, 3).join(" | ")}` : ""),
      stray.length === 0,
      "an unrecognised figure is either a stale price or a statistic nobody labelled; both need a human",
    );

    // AND THE CHECK IS NOT VACUOUS: it must have found real figures to look at.
    // A route list that stopped matching, or a strip that ate the body, would
    // otherwise pass by examining nothing.
    check(
      `it examined a plausible number of figures (${figures})`,
      figures >= 40 && pagesScanned >= 5,
      "too few figures seen — the page list or the markup strip is wrong, and this check is measuring nothing",
    );
  }

  // -------------------------------------------------------------------------
  // EVERY LETTER LINK RESOLVES IN BOTH CLICK-CODE FORMS.
  //
  // THIS WAS A LIVE 404 WAITING FOR A RE-RENDER, caught 6 Nov 2026 nine hours
  // before a send. Peter: *"re-render tomorrow's letters so they carry the
  // sentence"*. The frozen letters carry `?rc=<code>`; a fresh render carries
  // `/c/<code>`, because the code moved into the path when a mail gateway was
  // found stripping query parameters.
  //
  // The appeals app handles both — its middleware reads either. THE HUB DID
  // NOT. Measured against production:
  //
  //     /snf/2026-11-06-w1                       307
  //     /snf/2026-11-06-w1?rc=CODE               307
  //     /snf/2026-11-06-w1/c/CODE                404   <- both calls to action
  //     /demo/2026-11-06-w1/c/CODE               404
  //
  // So re-rendering would have put dead links in the two main calls to action
  // of forty letters, and the re-render tool could not have known: it renders
  // correct bytes pointing at a host that is a different repository.
  //
  // ORDER MATTERS AND IS ASSERTED. The path form must come BEFORE the shorter
  // pattern, or `/snf/:campaign` matches first and swallows `/c/<code>` as part
  // of a campaign name.
  {
    const redirects = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")).redirects ?? [];
    const campaignForms = redirects.filter((r) => /^\/(snf|demo)\/:campaign$/.test(r.source));
    check(
      `the letter-link redirects are present (${campaignForms.length})`,
      campaignForms.length >= 2,
      "without them the letters' short links do not resolve at all",
    );
    const missing = [];
    const misordered = [];
    for (const base of campaignForms) {
      const want = `${base.source}/c/:code`;
      const pathAt = redirects.findIndex((r) => r.source === want);
      const baseAt = redirects.findIndex((r) => r.source === base.source);
      if (pathAt === -1) missing.push(want);
      else if (pathAt > baseAt) misordered.push(`${want} must come before ${base.source}`);
    }
    check(
      `every letter link also resolves with the code in the path${missing.length ? ` — missing ${missing.join(", ")}` : ""}`,
      missing.length === 0,
      "a re-rendered letter carries /c/<code>; without this rule its call to action 404s",
    );
    check(
      `the path form is matched before the bare campaign form${misordered.length ? ` — ${misordered.join("; ")}` : ""}`,
      misordered.length === 0,
      "otherwise :campaign swallows the code and the reader lands on a page for a campaign that does not exist",
    );
    // AND THE CODE MUST SURVIVE THE HOP, or the link works and the click is
    // anonymous — which is worse than a 404 because nothing reports it.
    const codeless = redirects
      .filter((r) => r.source.endsWith("/c/:code"))
      .filter((r) => !r.destination.includes(":code"))
      .map((r) => r.source);
    check(
      `each path-form redirect carries the code to its destination${codeless.length ? ` — ${codeless.join(", ")} drops it` : ""}`,
      codeless.length === 0,
      "a redirect that drops the code resolves fine and attributes nobody",
    );
  }

  // -------------------------------------------------------------------------
  // US SPELLING ONLY, AND THIS REPOSITORY HAD NO SUCH CHECK.
  //
  // Found 6 Nov 2026 by the APPEALS repo's gate, not by anything here. That
  // gate has carried a US-spelling guard since the product was found using both
  // spellings inside one sentence; this repository never had one, so when I
  // wrote the new per-case pricing copy in British English it shipped. THIRTY
  // FIVE occurrences, thirteen of them reader-facing on the live enterprise
  // pricing page — "an unlimited licence", in a product that sells site
  // licenses to US nursing homes.
  //
  // THE ASYMMETRY IS THE LESSON. The hub is where cold outreach lands, so its
  // copy is read by more strangers than the app's is, and it had strictly fewer
  // copy guards. A rule enforced in one repository of two is a rule that holds
  // until somebody writes in the other one.
  //
  // CHECKED IN THE SOURCE, not the built pages, so the message names the file
  // somebody has to edit. Built pages are a consequence.
  {
    const offenders = [];
    for (const dir of ["content", "."]) {
      const base = dir === "." ? __dirname : join(__dirname, dir);
      for (const f of readdirSync(base)) {
        if (!/\.(html|mjs|json)$/.test(f)) continue;
        if (f === "verify.mjs") continue; // this file names the word to find it
        const src = readFileSync(join(base, f), "utf8");
        const hits = src.match(/\blicences?\b/gi);
        if (hits) offenders.push(`${dir === "." ? "" : dir + "/"}${f} (${hits.length})`);
      }
    }
    check(
      `US spelling only — no "licence" in the hub's source${offenders.length ? ` — ${offenders.join(", ")}` : ""}`,
      offenders.length === 0,
      "this product sells site licenses to US facilities; the British spelling shipped once already",
    );
  }

  const overview = read("/appeals/enterprise");
  check("the enterprise overview exists to check", overview !== null);
  if (overview) {
    check(
      "the overview carries NO price — one page owns the figures",
      !/\$499|\$424|\$374|\$324|\$299|\$199/.test(overview),
      "a price on two pages is a price that goes stale on one of them",
    );
  }
  if (page) {
    const p = pricingJson.portfolio;
    check("pricing.json carries portfolio bands", Boolean(p && p.bands && p.bands.length >= 3));
    if (p && p.bands) {
      // THE LICENSE IS A ONE-LINE CEILING NOW, NOT A PUBLISHED TABLE, so this
      // check changed shape on 6 Nov 2026. Peter: *"I thought the $499 is
      // gone"*, then — given that removing it would raise the price for the
      // heaviest users — he chose to keep the cap and shrink it to a sentence.
      //
      // IT WAS NOT SIMPLY LOOSENED. Three things are asserted:
      //   * the figures the sentence DOES publish are there, and come from the
      //     data rather than from prose
      //   * the ones deliberately withdrawn are ABSENT, so re-adding the table
      //     trips this check and says to restore the stronger form. A weakened
      //     guard that cannot notice its own repair stays weak for ever.
      //   * the discount percentages are gone with it, which is a real
      //     reduction in published terms and is recorded as a choice
      const list = p.bands[0].perSiteUsd;
      const deepest = p.bands[p.bands.length - 1].perSiteUsd;
      // SCOPED TO THE SENTENCE, NOT THE PAGE — and that distinction is the
      // whole check. The first version asked whether the page contained $499,
      // which it does anyway in the single-location plan cards further down, so
      // deleting the figure from the ceiling sentence left this GREEN. Found by
      // mutation immediately after writing it.
      //
      // The paragraph is located by its own heading, so if the heading is
      // renamed this fails rather than quietly measuring the whole document.
      const capBlock = (() => {
        const h = page.indexOf("The most you could ever pay");
        if (h < 0) return null;
        const end = page.indexOf("</p>", h);
        return end < 0 ? null : page.slice(h, end);
      })();
      check(
        "the ceiling paragraph can be found to check",
        capBlock !== null,
        "its heading changed: re-point this check or it measures nothing",
      );
      const published = [list.snf, list.home_health, list.hospice, deepest.snf];
      const missing = capBlock
        ? published.filter((n) => !capBlock.includes(`$${n}`)).map((n) => `$${n}`)
        : published.map((n) => `$${n}`);
      check(
        `the ceiling sentence itself carries the figures it claims${missing.length ? ` — missing ${missing.join(", ")}` : ""}`,
        missing.length === 0,
        "a reader cannot know the bound if the bound is not in the sentence that promises it",
      );

      const withdrawn = p.bands
        .flatMap((b) => ["snf", "home_health", "hospice"].map((seg) => b.perSiteUsd[seg]))
        .filter((n) => !published.includes(n));
      const reappeared = [...new Set(withdrawn.filter((n) => page.includes(`$${n}`)))];
      check(
        `the withdrawn per-site ceilings stay off the page${reappeared.length ? ` — $${reappeared.join(", $")} are back` : ""}`,
        reappeared.length === 0,
        "the license table is back: either restore the every-figure check above it, or take the table out again",
      );

      // READER-VISIBLE TEXT ONLY, and this was a false positive before it was a
      // check. Searching the raw HTML found "15%" inside a CSS gradient
      // position (`radial-gradient(... at 15% -10% ...)`) and reported the
      // withdrawn Group discount as still published. A percentage is a common
      // CSS unit, so style and script blocks have to go before asking whether a
      // percentage is a CLAIM.
      const visible = page
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<[^>]+>/g, " ");
      const pcts = p.bands.filter((b) => b.discountPercent > 0).map((b) => `${b.discountPercent}%`);
      const pctsOnPage = pcts.filter((x) => visible.includes(x));
      check(
        `the discount percentages are no longer published${pctsOnPage.length ? ` — ${pctsOnPage.join(", ")} present` : ""}`,
        pctsOnPage.length === 0,
        "they were withdrawn with the table on 6 Nov; if they are published again they must be generated and checked",
      );
    }
    // The non-profit rule has to be ON the page, not only in the data: it is
    // the rule a reader will test us on.
    check(
      "the page states that non-profit locations do not count toward the band",
      /non-profit/i.test(page) && /not<\/strong>? counted|not counted/i.test(page)
    );
  }
}

// ===========================================================================
// EVERY PAGE IS REACHABLE FROM THE ROOT. Peter, 1 Nov 2026: *"enfore a link for
// every page url"*, and earlier *"rule any page must be reasuable from a link"*.
//
// REACHABILITY, NOT "LINKED SOMEWHERE" — and the difference is the whole check.
//
// My first version asked whether any page contained an href to each path. It
// passed a mutation that deleted all five links from the enterprise overview,
// because the five sub-pages link to EACH OTHER: a closed cluster, unreachable
// from the rest of the site, every member "linked somewhere". Proved by
// deleting the links and watching the check stay green, which is the only way
// a check like this can be trusted.
//
// So this walks the link graph from `/` and reports what it cannot get to.
// That is what the rule means: a reader can arrive.
//
// WHAT COUNTS AS AN EDGE: an href in the built HTML, and a redirect in the
// generated vercel.json. The nav is an href like any other, so a page in the
// line nav is reachable on that alone.
{
  const allPaths = [
    ...lines.map((l) => `/${l.id}`),
    ...pages.map((p) => p.path),
    ...companyPages.map((p) => p.path),
  ];

  let routing = "";
  try {
    routing = readFileSync(join(ROOT, "vercel.json"), "utf8");
  } catch {
    routing = "";
  }

  /** Which of `allPaths` this page links to. */
  const edgesFrom = (path) => {
    const html = read(path);
    if (!html) return [];
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    // ABSOLUTE OR RELATIVE, both count as an edge. Every internal link is
    // absolute since Peter's rule landed, but accepting the relative form too
    // means this walk keeps working rather than silently finding nothing — a
    // reachability check that reaches nothing reports every page as an orphan,
    // which is a false alarm nobody would trust twice.
    const forms = (target) => [target, `${ORIGIN}${target}`];
    return allPaths.filter((target) =>
      forms(target).some((t) =>
        hrefs.some((h) => h === t || h.startsWith(`${t}?`) || h.startsWith(`${t}#`)),
      ),
    );
  };

  // A redirect destination is reachable from outside, so it seeds the walk
  // alongside the root.
  const seeds = ["/", ...allPaths.filter((t) => new RegExp(`"${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(routing))];
  const seen = new Set(seeds);
  const queue = [...seeds];
  while (queue.length > 0) {
    for (const next of edgesFrom(queue.shift())) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  const unreachable = allPaths.filter((p) => !seen.has(p));
  check(
    "every page is reachable by following links from the root",
    unreachable.length === 0,
    unreachable.length
      ? `cannot be reached from "/" by any chain of links: ${unreachable.join(", ")}. ` +
        `Link each from a page that is itself reachable — pages that only link to each other ` +
        `are a cluster, not a route.`
      : "",
  );
  check(
    "the walk actually walked (it would be vacuous otherwise)",
    seen.size > seeds.length + 3,
    `the walk reached ${seen.size} of ${allPaths.length} paths from ${seeds.length} seed(s)`,
  );
}

// ===========================================================================
// EVERY INTERNAL LINK IS A FULL LINK. Peter, 1 Nov 2026: *"i said before a rule
// links must be the full link"* — he had given the rule before and I had not
// recorded it anywhere, which is why he had to give it twice. This check is so
// that cannot happen a third time.
//
// WHY IT MATTERS ON THESE PAGES PARTICULARLY: they are the destination of cold
// outreach. A reader forwards one to a colleague, pastes it into a procurement
// email, or saves the page — and a relative href survives none of that once the
// HTML leaves the browser. The canonical, the og:url and the sitemap were
// already absolute; the links a human actually clicks were not.
//
// ASSETS ARE NOT LINKS. `<link rel="icon" href="/brand/icon-192.png">` stays
// relative: it is resolved by the browser against the document and never
// copied by a person. The rule is about places a reader can go.
{
  const offenders = [];
  for (const path of [
    ...lines.map((l) => `/${l.id}`),
    ...pages.map((p) => p.path),
    ...companyPages.map((p) => p.path),
    "/",
  ]) {
    const html = read(path);
    if (!html) continue;
    // An <a href> starting with a single slash. Not "//", not an asset tag —
    // this looks only at anchors.
    const relative = [...html.matchAll(/<a\b[^>]*\bhref="(\/(?!\/)[^"]*)"/g)].map((m) => m[1]);
    if (relative.length > 0) {
      offenders.push(`${path} -> ${[...new Set(relative)].join(", ")}`);
    }
  }
  check(
    "every anchor is a full link, never a relative path",
    offenders.length === 0,
    offenders.length
      ? `relative anchors found — prefix them with ORIGIN:\n    ${offenders.join("\n    ")}`
      : "",
  );
}


// ===========================================================================
// EVERY INTERNAL LINK MUST RESOLVE — not merely exist.
//
// Peter, 4 Nov 2026: *"do an audit on casewhyhub to ensure every link is
// pointing to either internnally or to appeals.casewhy.com"*.
//
// THE AUDIT FOUND ONE DEAD LINK AND THIS FILE HAD PASSED IT EVERY TIME.
// /appeals/enterprise proved its central claim — "every Medicare appeal" — with
// a link to `https://casewhyhub.com/coverage`. There is no such page here and
// never was; that path answers 404. The claim check above was satisfied by
// `html.includes("/coverage")`, which asks whether a link is PRESENT and not
// whether it goes anywhere.
//
// That page is where cold outreach sends an operator, so the one page that most
// needed its evidence to hold was the one proving it with a dead end.
//
// A REDIRECT COUNTS, which is Peter's own rule and not a concession: /schools
// has no file and answers 308 to /uscis/schools, so it is a working link. The
// check consults the redirect table for exactly that reason — without it, this
// would have reported four healthy links as broken.
//
// ASSETS ARE STILL NOT LINKS. Anchors only, same scope as the relative-path
// check above.
{
  const pagePaths = new Set([
    "/",
    ...lines.map((l) => `/${l.id}`),
    ...pages.map((p) => p.path),
    ...companyPages.map((p) => p.path),
  ]);
  const redirectFroms = new Set(
    (redirects || []).map((r) => String(r.from).replace(/\/:.*$/, ""))
  );
  const offenders = [];
  for (const path of [...pagePaths]) {
    const html = read(path);
    if (!html) continue;
    for (const m of html.matchAll(/<a\b[^>]*\bhref="https:\/\/casewhyhub\.com([^"]*)"/g)) {
      const target = (m[1].split("#")[0].split("?")[0] || "/").replace(/\/$/, "") || "/";
      if (pagePaths.has(target)) continue;
      // A redirect, including the parameterised ones (/snf/:campaign), which
      // are matched on their stem.
      if (redirectFroms.has(target)) continue;
      if ([...redirectFroms].some((f) => f && target.startsWith(f + "/"))) continue;
      // A real file on disk — covers anything hand-authored outside pages.json.
      if (
        existsSync(join(ROOT, target.replace(/^\//, ""))) ||
        existsSync(join(ROOT, target.replace(/^\//, ""), "index.html"))
      ) {
        continue;
      }
      offenders.push(`${path} -> https://casewhyhub.com${target}`);
    }
  }
  check(
    "every internal link resolves to a page, a redirect or a file",
    offenders.length === 0,
    offenders.length
      ? `internal links that go nowhere:\n    ${[...new Set(offenders)].join("\n    ")}`
      : "",
  );
}


// ===========================================================================
// THE SEO CATCH-UP OF 4 NOV 2026 — the two things the audit found missing.
//
// Peter: *"do a SEO catchup for the new links / pages added since the initial
// SEO"*. The audit found the per-page metadata COMPLETE across all 35 pages —
// title, description, self-referential canonical, four og tags, twitter card,
// WebPage structured data, no duplicate titles or descriptions. Two gaps:
// no sitemap carried a lastmod, and no page carried a breadcrumb trail while
// 29 of 35 sit two or three levels deep.
{
  const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const mods = [...sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]);
  check(`every sitemap URL carries a lastmod (${mods.length} of ${locs.length})`, locs.length > 0 && mods.length === locs.length);

  // NOT ALL THE SAME DATE — the check that makes the one above mean something.
  //
  // `new Date()` on every URL would satisfy "has a lastmod" and tell a crawler
  // all thirty-five pages changed today, every time the generator runs. That is
  // how a site teaches Google to ignore its sitemap. The dates come from the
  // last commit touching each page's content file, so they differ: measured on
  // the day this shipped, 31 pages at 2026-11-01, three at 2026-09-15 and one
  // at 2026-10-21 — the USCIS attorney pages genuinely had not changed since
  // September, and the sitemap now says so.
  check(
    `lastmod dates are not all identical (${new Set(mods).size} distinct)`,
    new Set(mods).size > 1,
    new Set(mods).size <= 1 ? "every page claims the same change date — that is a clock stamp, not a fact" : ""
  );
}

{
  const offenders = [];
  const noTrail = [];
  for (const path of [...lines.map((l) => l.path), ...pages.map((p) => p.path), ...companyPages.map((p) => p.path)]) {
    if (path.split("/").filter(Boolean).length < 2) continue;
    const html = read(path);
    if (!html) continue;
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const crumb = blocks.map((b) => { try { return JSON.parse(b); } catch { return null; } })
      .find((d) => d && d["@type"] === "BreadcrumbList");
    if (!crumb) { noTrail.push(path); continue; }
    // THE LAST STEP MUST BE THE PAGE ITSELF. A trail that ends at an ancestor
    // is worse than none: Google renders it, and it renders the wrong page.
    const last = crumb.itemListElement[crumb.itemListElement.length - 1];
    if (!last || last.item.replace(/\/$/, "") !== `https://casewhyhub.com${path}`.replace(/\/$/, "")) {
      offenders.push(`${path} -> trail ends at ${last && last.item}`);
    }
  }
  check(
    `every page below the top level has a breadcrumb trail (${noTrail.length} missing)`,
    noTrail.length === 0,
    noTrail.length ? `no BreadcrumbList on:\n    ${noTrail.join("\n    ")}` : ""
  );
  check(
    "every breadcrumb trail ends at its own page",
    offenders.length === 0,
    offenders.length ? `trails ending somewhere else:\n    ${offenders.join("\n    ")}` : ""
  );
}


// ===========================================================================
// THE MULTI-FACILITY BAND ON /appeals — Peter, 4 Nov 2026: this proposition
// *"should have a more prominent presence ... and not lumped in among other 4
// cards"*.
//
// IT REPLACED THE DIRECTORY CARD, and that is why this check exists. The card
// for /appeals/enterprise was the ONLY link to the overview from this page —
// every other inbound link comes from the overview's own children. If the band
// loses its primary button, the overview becomes reachable only THROUGH its
// sub-pages. The root-reachability walk would still pass, which is exactly why
// it needs its own check.
//
// AND THE FOUR LINKS ARE THE POINT OF THE BAND. Before it, six of the seven
// enterprise pages were not on /appeals at all. A band that drifts back to one
// link rebuilds the problem it was added to fix.
{
  const appeals = read("/appeals");
  check("/appeals has the multi-facility band", appeals !== null && /class="ent-band"/.test(appeals));
  if (appeals) {
    for (const [target, why] of [
      ["/appeals/enterprise", "the overview — its only direct link from this page"],
      ["/appeals/enterprise/pricing", "pricing, which says published-not-quoted"],
      ["/appeals/enterprise/pilot", "the 30-day pilot"],
      ["/appeals/enterprise/open-an-account", "open an account"],
    ]) {
      check(
        `the band links ${target} (${why})`,
        appeals.includes(`href="https://casewhyhub.com${target}"`)
      );
    }
    // NO FIGURE HERE EITHER. The pricing page owns the numbers; the overview is
    // already checked for this and the band is the same hazard one level up.
    check(
      "the band carries no price figure — the pricing page owns them",
      !/\$499|\$424|\$374|\$324|\$299|\$199/.test(
        (appeals.match(/<section class="ent-band"[\s\S]*?<\/section>/) || [""])[0]
      ),
      "a price in two places is a price that goes stale in one of them",
    );
    // THE DIRECTORY MUST NOT SAY IT TWICE. The card was removed when the band
    // landed; a reinstated card is the duplication Peter pointed at.
    check(
      "the directory does not repeat the band as a card",
      !/<a class="card[^"]*" href="https:\/\/casewhyhub\.com\/appeals\/enterprise"/.test(appeals),
      "the band and a card both point at the overview — pick one",
    );
    // AND THE DIRECTORY IS ADDRESSED TO THE SINGLE-BUILDING READER, which is
    // what makes it safe for the band to sit above it.
    check(
      "the directory heading tells a single-facility reader it is theirs",
      /One building/.test(appeals)
    );
  }
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
