// Round 122 follow-up — live-refresh pipeline for the community/cultural
// org directory (USCIS's Citizenship and Integration Grant Program). Ports
// the manual research process scripts/seed-community-orgs.ts's own data
// went through into something re-runnable: fetch each fiscal year's own
// landing page (2022+ only -- USCIS's per-org recipient PDF format doesn't
// exist before FY2022, confirmed in that seed script's own header comment),
// find its current PDF link (filenames/paths are NOT stable across years --
// confirmed by direct inspection: FY22 is under /document/web-content/,
// FY23 under /document/notices/, FY24 under /document/reports/, so this
// deliberately discovers the href from the landing page's own HTML rather
// than hardcoding a guessed filename), parse it, and merge with a small
// frozen historical dataset for FY2011/2012 (see historical-fy2011-2012.json
// -- those two years only exist as HTML press releases with no per-org
// description or award field, and are a fixed historical fact that will
// never change, so there's nothing to "refresh" there; re-parsing that HTML
// on every run would just add fragility for zero benefit).
//
// Known, disclosed parsing gap: FY2023's PDF has 64 "Location:" occurrences
// in its raw text but this parser recovers 61 real entries (~95%) -- some
// entries' "Location:" line doesn't merge cleanly with its own row under
// this module's y-tolerance grouping. Same category of imperfection this
// project's other PDF pipelines (DOJ roster, pro-bono list) already
// disclose rather than silently claim away.

import { CigpRecord, FETCH_HEADERS } from "./types";
import { fetchCigpLandingPageAndParse } from "./parse-pdf";
import historicalRaw from "./historical-fy2011-2012.json";

const MODERN_YEARS: { year: string; url: string }[] = [
  {
    year: "FY2022",
    url: "https://www.uscis.gov/citizenship-resource-center/civic-integration/learn-about-the-citizenship-and-integration-grant-program/fy-2022-grant-recipients",
  },
  {
    year: "FY2023",
    url: "https://www.uscis.gov/citizenship-resource-center/civic-integration/learn-about-the-citizenship-and-integration-grant-program/fy-2023-grant-recipients",
  },
  {
    year: "FY2024",
    url: "https://www.uscis.gov/citizenship-resource-center/civic-assimilation/learn-about-the-citizenship-and-assimilation-grant-program/fy-2024-grant-recipients",
  },
];

const MODERN_SOURCE_CITATION = (year: string) =>
  `Sourced from USCIS's Citizenship and Integration Grant Program recipient records, ${year}, pulled ${new Date()
    .toISOString()
    .slice(0, 10)}. This list reflects organizations that received this specific federal grant, not all community organizations.`;

interface HistoricalRecord {
  organization_name: string;
  city_state_zip: string;
  state: string;
  description: string | null;
  fiscal_years_awarded: string;
  source_citation?: string;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CigpFetchResult {
  records: CigpRecord[];
  perYearCounts: Record<string, number>;
}

export async function fetchAndParseCigp(): Promise<CigpFetchResult> {
  const perYearCounts: Record<string, number> = {};

  // key: normalized name + "|" + state
  const merged = new Map<string, { record: CigpRecord; years: Set<string> }>();

  function upsert(
    organizationName: string,
    cityStateZip: string,
    state: string,
    description: string | null,
    year: string,
    sourceCitation: string
  ) {
    const key = `${normalizeName(organizationName)}|${state}`;
    const existing = merged.get(key);
    if (existing) {
      existing.years.add(year);
      // Modern years (with a real description) take priority over the
      // historical name/location-only fallback -- keep whichever
      // description is non-null, preferring the one just added since
      // years are processed oldest-to-newest below.
      if (description) {
        existing.record.description = description;
        existing.record.sourceCitation = sourceCitation;
      }
    } else {
      merged.set(key, {
        record: { organizationName, cityStateZip, state, description, fiscalYearsAwarded: "", sourceCitation },
        years: new Set([year]),
      });
    }
  }

  // Historical years first (oldest), so a modern year's real description
  // always wins the final overwrite if the same org appears in both.
  for (const r of historicalRaw as HistoricalRecord[]) {
    const years = r.fiscal_years_awarded.split(",").map((y) => y.trim());
    for (const year of years) {
      upsert(r.organization_name, r.city_state_zip, r.state, r.description, year, r.source_citation ?? "");
    }
  }

  for (const { year, url } of MODERN_YEARS) {
    const entries = await fetchCigpLandingPageAndParse(url);
    perYearCounts[year] = entries.length;
    const citation = MODERN_SOURCE_CITATION(year);
    for (const e of entries) {
      upsert(e.organizationName, e.cityStateZip, e.state, e.description, year, citation);
    }
  }

  const records: CigpRecord[] = [];
  for (const { record, years } of merged.values()) {
    // Most recent year first, matching the existing seed data's own
    // "FY2024, FY2022, FY2012" descending convention.
    const sortedYears = [...years].sort((a, b) => b.localeCompare(a));
    record.fiscalYearsAwarded = sortedYears.join(", ");
    records.push(record);
  }

  return { records, perYearCounts };
}

export { FETCH_HEADERS };
