// Round 110 — builds public/search-index.{en,es}.json from CaseWhy's own
// content registries. Run in `prebuild` (package.json) and CI, same
// pattern as scripts/check-language-switcher.ts. Nothing here is a hand-
// typed list of content -- every source is an existing registry (POLICY_
// MEMOS, PROCESSING_TIMES, PUBLIC_PAGES, the FAQ mirror, the merged blog
// posts, live /news items) per the round's own standing rule: a new memo,
// post, FAQ entry, or page becomes searchable by existing in its registry,
// not by someone remembering to add it here too.
//
// Section 6 correction (verified before writing this, not assumed from
// the task doc): the task doc's own text says to use "the pages' existing
// Spanish labels (labelEs)" for processing-time/visa-bulletin rows -- no
// such field exists on ProcessingTimeEntry, FieldOfficeOnlyForm, or
// BulletinRow (checked all three interfaces directly; visa-bulletin/
// page.tsx renders {row.label} unconditionally, no `es ?` branch at all).
// This isn't a contradiction to "fix the doc" over, though -- it's
// exactly the fallback case Section 6 itself already describes: those
// docs get `locale: "en"` in the Spanish index and the overlay tags them
// "(en inglés)", same as an English-only /updates post would.

import { writeFileSync } from "fs";
import { join } from "path";
import { POLICY_MEMOS } from "../src/lib/kb/policy-memos";
import { PROCESSING_TIMES, FIELD_OFFICE_ONLY_FORMS } from "../src/lib/kb/processing-times";
import { FAMILY_FINAL_ACTION, EMPLOYMENT_FINAL_ACTION, bulletinDateLabel } from "../src/lib/kb/visa-bulletin";
import { PUBLIC_PAGES } from "../src/lib/site/pages";
import { FAQ_SEARCH_ENTRIES } from "../src/lib/search/faq-search-data";
import { slugify } from "../src/lib/search/slugify";
import { NEWS_SOURCES } from "../src/lib/news/sources";
import { fetchNews } from "../src/lib/news/fetch-news";
import { newsItemId } from "../src/lib/news/permalink";
import { getPublishedUpdates } from "../src/lib/updates/updates";

const MAX_INDEX_BYTES = 400 * 1024;

export interface SearchDoc {
  // Drives which overlay group (Answers/Reference/Pages) a hit renders in.
  type: "answer" | "reference" | "page";
  title: string;
  snippet: string;
  url: string;
  keywords: string;
  /** The actual language of THIS item's content, independent of which locale's JSON file it's in -- a doc can appear in the "es" file with locale "en" (Section 6's explicit fallback), never silently dropped or machine-translated. */
  locale: "en" | "es";
}

function buildDocs(
  locale: "en" | "es",
  newsItems: Awaited<ReturnType<typeof fetchNews>>["items"],
  posts: Awaited<ReturnType<typeof getPublishedUpdates>>
): SearchDoc[] {
  const es = locale === "es";
  const docs: SearchDoc[] = [];

  // FAQ -- forked routes (/faq vs /es/faq, round 97), not query-param
  // locale-switched, so the Spanish url is a real different path. Each
  // page's own id={slugify(faq.question)} slugifies whatever text it
  // actually renders (English on /faq, Spanish on /es/faq) -- this has to
  // slugify the SAME locale's question text or the anchor here wouldn't
  // match the id actually present on the page. Caught by tracing the
  // rendered id through, not assumed.
  for (const f of FAQ_SEARCH_ENTRIES) {
    const question = es ? f.questionEs : f.question;
    docs.push({
      type: "answer",
      title: question,
      snippet: es ? f.snippetEs : f.snippet,
      url: `${es ? "/es/faq" : "/faq"}#${slugify(question)}`,
      keywords: `${f.group} ${f.groupEs}`,
      locale,
    });
  }

  // Policy memos -- in-place locale (round 105's titleEs/summaryEs),
  // ?lang=es url per the task doc's explicit Section 6 instruction.
  for (const m of POLICY_MEMOS) {
    const hasEs = Boolean(m.titleEs && m.summaryEs);
    const title = es && hasEs ? m.titleEs! : m.title;
    const summary = es && hasEs ? m.summaryEs! : m.summary;
    docs.push({
      type: "answer",
      title,
      snippet: summary.slice(0, 180),
      url: `/policy/${m.id}${es ? "?lang=es" : ""}`,
      keywords: m.memoNumber ?? "",
      locale: es && !hasEs ? "en" : locale,
    });
  }

  // Blog posts -- keep their own authored lang (round 93/107), no
  // query-param switching; a post is only in the index whose language it
  // was written in.
  for (const p of posts) {
    if (!p.publishedAt) continue;
    if (p.lang !== locale) continue;
    docs.push({
      type: "answer",
      title: p.title,
      snippet: p.summary.slice(0, 180),
      url: `/updates/${p.slug}`,
      keywords: "",
      locale,
    });
  }

  // Processing times -- categoryLabel has no Spanish field (verified, see
  // file header). Only the unit word and the FIELD_OFFICE_ONLY_FORMS note
  // wrapper text are translated; the entry itself is tagged locale: "en"
  // in the Spanish index so the overlay shows "(en inglés)".
  for (const e of PROCESSING_TIMES) {
    docs.push({
      type: "reference",
      title: `${e.formType} — ${e.categoryLabel} — ${e.percentile80Months} ${es ? "meses" : "months"}`,
      snippet: es ? `Al ${e.asOf}` : `As of ${e.asOf}`,
      url: `/processing-times${es ? "?lang=es" : ""}#${e.id}`,
      keywords: `${e.formType.replace("-", "")} ${e.formType}`,
      locale: "en",
    });
  }
  for (const f of FIELD_OFFICE_ONLY_FORMS) {
    docs.push({
      type: "reference",
      title: `${f.formType}${f.categoryLabel ? " — " + f.categoryLabel : ""}`,
      snippet: f.note.slice(0, 180),
      url: `/processing-times${es ? "?lang=es" : ""}#field-office-only`,
      keywords: f.formType.replace("-", ""),
      locale: "en",
    });
  }

  // Visa bulletin -- row.label is English-only (verified against
  // visa-bulletin/page.tsx directly, no es branch renders it). Dates/
  // "Current"/"Unavailable" via bulletinDateLabel ARE locale-aware, so the
  // snippet is real Spanish; the title (which includes row.label) is not,
  // so this is tagged locale: "en".
  for (const row of [...FAMILY_FINAL_ACTION, ...EMPLOYMENT_FINAL_ACTION]) {
    docs.push({
      type: "reference",
      title: `${row.category} — ${row.label}`,
      snippet: `${es ? "Todos los demás países" : "All other countries"}: ${bulletinDateLabel(row.allOther, es)}`,
      url: `/visa-bulletin${es ? "?lang=es" : ""}#${row.category.toLowerCase()}`,
      keywords: row.category,
      locale: "en",
    });
  }

  // News -- best-effort; a failed live fetch at build time drops this
  // section for this build rather than failing the whole index. Source
  // feeds are English-only (src/lib/news/sources.ts), so these are always
  // locale: "en", same real-content-language reasoning as above.
  for (const item of newsItems) {
    docs.push({
      type: "reference",
      title: item.title,
      snippet: item.sourceName,
      url: `/news/${newsItemId(item)}`,
      keywords: "",
      locale: "en",
    });
  }

  // Pages -- three real cases, not two: hrefEs set means a genuinely
  // forked Spanish route (use it as-is); no hrefEs but labelEs set means
  // an in-place-localized page (round 105 pattern -- append ?lang=es,
  // same as the processing-times/visa-bulletin reference docs above);
  // neither set means genuinely English-only content.
  for (const p of PUBLIC_PAGES.filter((p) => p.showInIndex)) {
    if (!es) {
      docs.push({ type: "page", title: p.label, snippet: "", url: p.href, keywords: "", locale: "en" });
      continue;
    }
    if (p.hrefEs) {
      docs.push({ type: "page", title: p.labelEs ?? p.label, snippet: "", url: p.hrefEs, keywords: "", locale: "es" });
    } else if (p.labelEs) {
      docs.push({ type: "page", title: p.labelEs, snippet: "", url: `${p.href}?lang=es`, keywords: "", locale: "es" });
    } else {
      docs.push({ type: "page", title: p.label, snippet: "", url: p.href, keywords: "", locale: "en" });
    }
  }

  return docs;
}

async function main() {
  const [newsResult, posts] = await Promise.all([
    fetchNews(new Set(NEWS_SOURCES.map((s) => s.id))).catch((err) => {
      console.warn("[build-search-index] news fetch failed, indexing without it:", err instanceof Error ? err.message : err);
      return { items: [], failedSources: [] };
    }),
    getPublishedUpdates().catch((err) => {
      console.warn("[build-search-index] blog post read failed, indexing without it:", err instanceof Error ? err.message : err);
      return [];
    }),
  ]);

  for (const locale of ["en", "es"] as const) {
    const docs = buildDocs(locale, newsResult.items, posts);
    const json = JSON.stringify(docs);
    const bytes = Buffer.byteLength(json, "utf-8");
    const outPath = join(process.cwd(), "public", `search-index.${locale}.json`);
    writeFileSync(outPath, json);
    console.log(`[build-search-index] ${locale}: ${docs.length} docs, ${(bytes / 1024).toFixed(1)} KB -> ${outPath}`);
    if (bytes > MAX_INDEX_BYTES) {
      console.error(
        `[build-search-index] ${locale} index is ${(bytes / 1024).toFixed(1)} KB, over the ${MAX_INDEX_BYTES / 1024} KB guard. This is the signal to move content search server-side, not to trim content -- see round 110's task doc.`
      );
      process.exitCode = 1;
    }
  }
}

main();
