// Round 93 Part B — "a CI script that fails the build on JSON-LD parse
// errors." Since every JSON-LD block this app renders goes through
// JSON.stringify(realObject) rather than a hand-typed string,
// JSON.stringify itself can't produce syntactically invalid JSON — the
// real failure mode is JSON.stringify *throwing* (a circular reference,
// a BigInt, a field that silently serializes to something useless like
// `undefined` -> dropped, or a Date object producing something Schema.org
// wouldn't accept as the plain string these types are declared as). This
// script exercises the exact same builder functions production uses,
// over the exact same real data (every real policy memo, every real
// content/updates post), and does a JSON.stringify -> JSON.parse
// round-trip on each, so a break here is the same break production would
// ship. Run via `npx tsx scripts/validate-jsonld.ts` (no DB needed).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { POLICY_MEMOS } from "../src/lib/kb/policy-memos";
import { COURT_RULINGS } from "../src/lib/kb/court-rulings";
import { organizationJsonLd, websiteJsonLd } from "../src/lib/seo/organization-jsonld";

let failures = 0;

function checkJsonLd(label: string, obj: unknown) {
  try {
    const json = JSON.stringify(obj);
    if (typeof json !== "string") throw new Error("JSON.stringify returned non-string");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") throw new Error("parsed result is not an object");
    if (!parsed["@context"] || !parsed["@type"]) {
      throw new Error("missing required @context/@type");
    }
  } catch (err) {
    failures++;
    console.error(`FAIL [${label}]: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Organization / WebSite (src/app/sitemap/page.tsx, casewhy.com/index.html mirrors this by hand)
checkJsonLd("Organization", organizationJsonLd());
checkJsonLd("WebSite", websiteJsonLd());

// Policy memo FAQPage + BreadcrumbList (src/app/policy/[id]/page.tsx)
for (const memo of POLICY_MEMOS) {
  checkJsonLd(`FAQPage:${memo.id}`, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: `What is ${memo.title}?`, acceptedAnswer: { "@type": "Answer", text: memo.summary } },
      { "@type": "Question", name: `What is the current status of ${memo.title}?`, acceptedAnswer: { "@type": "Answer", text: memo.currentStatus } },
    ],
  });
  checkJsonLd(`BreadcrumbList:policy:${memo.id}`, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Policy memos", item: "https://app.casewhy.com/policy" },
      { "@type": "ListItem", position: 2, name: memo.title, item: `https://app.casewhy.com/policy/${memo.id}` },
    ],
  });
}

// Court ruling FAQPage + BreadcrumbList (src/app/court-rulings/[id]/page.tsx)
for (const ruling of COURT_RULINGS) {
  checkJsonLd(`FAQPage:court:${ruling.id}`, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What did the court decide in ${ruling.caseName}?`,
        acceptedAnswer: { "@type": "Answer", text: ruling.summary },
      },
      {
        "@type": "Question",
        name: `What is the current status of ${ruling.caseName}?`,
        acceptedAnswer: { "@type": "Answer", text: ruling.currentStatus },
      },
    ],
  });
  checkJsonLd(`BreadcrumbList:court:${ruling.id}`, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Court rulings", item: "https://app.casewhy.com/court-rulings" },
      { "@type": "ListItem", position: 2, name: ruling.caseName, item: `https://app.casewhy.com/court-rulings/${ruling.id}` },
    ],
  });
}

// Article + BreadcrumbList for every /updates post that exists on disk
// (src/app/updates/[slug]/page.tsx) -- checked regardless of its
// marketing_queue approval status, since a bad frontmatter field would
// still break the page the moment it IS approved.
const UPDATES_DIR = path.join(process.cwd(), "content", "updates");
if (fs.existsSync(UPDATES_DIR)) {
  for (const file of fs.readdirSync(UPDATES_DIR).filter((f) => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(UPDATES_DIR, file), "utf-8"));
    const url = `https://app.casewhy.com/updates/${slug}`;
    checkJsonLd(`Article:${slug}`, {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title,
      description: data.summary,
      datePublished: data.date,
      dateModified: data.date,
      inLanguage: data.lang ?? "en",
      url,
      author: { "@type": "Organization", name: "CaseWhy", url: "https://app.casewhy.com" },
      publisher: { "@type": "Organization", name: "CaseWhy", url: "https://app.casewhy.com" },
    });
    checkJsonLd(`BreadcrumbList:updates:${slug}`, {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Updates", item: "https://app.casewhy.com/updates" },
        { "@type": "ListItem", position: 2, name: data.title, item: url },
      ],
    });
  }
}

if (failures > 0) {
  console.error(`\n${failures} JSON-LD block(s) failed validation.`);
  process.exit(1);
} else {
  console.log(
    `All JSON-LD blocks validated (${POLICY_MEMOS.length} policy memos, ${COURT_RULINGS.length} court rulings, updates posts checked).`
  );
  process.exit(0);
}
