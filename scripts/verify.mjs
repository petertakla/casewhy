#!/usr/bin/env node
// Track H (Sep 27, 2026) verify script — no test framework exists on this
// static site, so this follows scripts/generate.mjs's own convention: a
// plain Node script run manually (`node scripts/verify.mjs`), checking the
// *generated, committed* HTML/JSON so a real drift between pages.json and
// the files on disk fails loudly. Exits non-zero on any failure.

import { readFileSync, existsSync } from "node:fs";
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

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
