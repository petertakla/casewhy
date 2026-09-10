// Round 59 — refreshes the cached copy of EOIR's "List of Currently
// Disciplined Practitioners" (justice.gov/eoir/list-of-currently-
// disciplined-practitioners), a real HTML table (no API, no bulk export —
// the page itself flags new entries "(NEW)" since it changes over time).
// Delete-and-reseed, same pattern as every other directory here. Meant to
// run monthly (attorney discipline is time-sensitive in a way stale
// contact info isn't) — see CLOUD_CLAUDE.md "Round 59" for the recommended
// cadence; this script itself doesn't schedule anything.
//
// Usage:
//   npx tsx scripts/refresh-disciplined-practitioners.ts

import { getDb } from "../src/lib/db/client";
import { disciplinedPractitioners } from "../src/lib/db/schema";
import { normalizeName, extractStates } from "../src/lib/discipline/match";

const SOURCE_URL = "https://www.justice.gov/eoir/list-of-currently-disciplined-practitioners";
const SOURCE_CITATION = `Sourced from EOIR's List of Currently Disciplined Practitioners (${SOURCE_URL}).`;

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedRow {
  name: string;
  cityState: string;
  dateImmediateSuspension: string | null;
  finalDisciplineImposed: string | null;
  effectiveDate: string | null;
  reinstated: boolean;
}

function parseTable(html: string): ParsedRow[] {
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/);
  if (!tableMatch) {
    throw new Error("Could not find the discipline table in the fetched page — layout may have changed.");
  }
  const rowMatches = [...tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const rows: ParsedRow[] = [];

  for (const [, rowHtml] of rowMatches) {
    const cellMatches = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => stripTags(m[1]));
    if (cellMatches.length < 6) continue;
    const [rawName, cityState, dateImmediateSuspension, finalDisciplineImposed, effectiveDate, reinstated] =
      cellMatches;
    if (rawName.toLowerCase() === "name") continue; // header row

    const name = rawName.replace(/\s*\(NEW\)\s*$/i, "").trim();
    if (!name) continue;

    rows.push({
      name,
      cityState,
      dateImmediateSuspension: /^-+$/.test(dateImmediateSuspension) ? null : dateImmediateSuspension || null,
      finalDisciplineImposed: finalDisciplineImposed || null,
      effectiveDate: /^-+$/.test(effectiveDate) ? null : effectiveDate || null,
      reinstated: reinstated.trim().toLowerCase() === "yes",
    });
  }
  return rows;
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${res.status}`);
  }
  const html = await res.text();
  const rows = parseTable(html);
  if (rows.length < 500) {
    // Real page has 1000+ rows — a suspiciously low count means the page
    // layout changed or the fetch got a stub/error page, not real data.
    throw new Error(`Only parsed ${rows.length} rows — expected 1000+. Refusing to reseed with what looks like bad data.`);
  }

  const db = getDb();
  await db.delete(disciplinedPractitioners);

  for (const row of rows) {
    await db.insert(disciplinedPractitioners).values({
      name: row.name,
      normalizedName: normalizeName(row.name),
      cityState: row.cityState,
      states: extractStates(row.cityState).join(","),
      dateImmediateSuspension: row.dateImmediateSuspension,
      finalDisciplineImposed: row.finalDisciplineImposed,
      effectiveDate: row.effectiveDate,
      reinstated: row.reinstated,
      sourceCitation: SOURCE_CITATION,
    });
  }

  console.log(`Seeded ${rows.length} disciplined-practitioner records.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
