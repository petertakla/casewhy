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
  check(`${path} keeps the approved BAA wording`,
    html.includes("no HIPAA business associate agreement is needed between us"));
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

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
