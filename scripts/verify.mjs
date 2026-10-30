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
  (read("/appeals") ?? "").includes('href="/appeals/families"')
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
  check(`/appeals/facilities links to ${sub}`, facilitiesChooser !== null && facilitiesChooser.includes(`href="${sub}"`));
  check(`${sub} exists`, read(sub) !== null);
  check(`${sub} links back to the chooser`, (read(sub) ?? "").includes('href="/appeals/facilities"'));
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
  const page = read("/appeals/enterprise");
  check("the enterprise page exists to check", page !== null);
  if (page) {
    const p = pricingJson.portfolio;
    check("pricing.json carries portfolio bands", Boolean(p && p.bands && p.bands.length >= 3));
    if (p && p.bands) {
      const missing = [];
      for (const b of p.bands) {
        for (const seg of ["snf", "home_health", "hospice"]) {
          const figure = `$${b.perSiteUsd[seg]}`;
          if (!page.includes(figure)) missing.push(`${b.id}/${seg} ${figure}`);
        }
      }
      check(
        `every portfolio band figure appears on the page${missing.length ? ` — missing ${missing.slice(0, 4).join(", ")}` : ""}`,
        missing.length === 0
      );
      // AND THE DISCOUNTS, because a table with the right prices under the
      // wrong percentages is still wrong, and reads as deliberate.
      const pcts = p.bands.filter((b) => b.discountPercent > 0).map((b) => `${b.discountPercent}%`);
      check(
        `every discount percentage appears too (${pcts.join(", ")})`,
        pcts.every((x) => page.includes(x))
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

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
