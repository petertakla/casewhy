// Round 122 follow-up — live-refresh pipeline for the DSO/school directory,
// sourced from DHS's "Study in the States" School Search
// (studyinthestates.dhs.gov/school-search). Confirmed by direct inspection:
// this is a plain server-rendered Drupal View with real GET-parameter
// paging (?field_education_level_value=1&page=N) -- no headless browser or
// AJAX endpoint needed, same "a real browser User-Agent on a plain fetch is
// enough" finding scripts/seed-dso-directory.ts's own header comment
// already made for the one-time pull. field_education_level_value=1 is
// "Higher Education" (confirmed against the page's own <select> options),
// matching this entity type's deliberate scope (round 43's own framing:
// "university international student offices", not K-12/flight/language
// schools). Page 0's "results-total" (6,068) matched the original one-time
// seed's own count almost exactly, confirming this is the right filter.
//
// Known source quirks, handled here the same way the original one-time
// pull's own header comment disclosed them: (1) a literal double-comma
// typo appears on at least one real row's address -- handled by splitting
// on comma, trimming, and dropping empty segments rather than assuming a
// fixed part count. (2) Some fields carry HTML entities escaped twice
// (e.g. "&amp;amp;" for a literal "&") -- decoded via two unescape passes.
// (3) DHS's data has no phone or website field anywhere for a listing --
// left null, same "link out, don't fabricate" shape as before.

import { FETCH_HEADERS } from "../attorney-sources/types";

const BASE_URL = "https://studyinthestates.dhs.gov/school-search";
const PAGE_SIZE = 60; // confirmed by direct inspection of one real page's row count

export interface DsoRecord {
  schoolName: string;
  campusName: string | null;
  isMainCampus: boolean;
  f1Certified: boolean;
  m1Certified: boolean;
  streetAddress: string | null;
  cityStateZip: string | null;
  state: string;
}

function unescapeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function unescapeTwice(input: string): string {
  return unescapeHtml(unescapeHtml(input));
}

const ROW_START_RE = /<div class="views-row">/g;

const NAME_RE = /<a href="[^"]*"\s+rel="([^"]*)"/;
const CAMPUS_RE = /<i class="main-campus-([YN])"><\/i><strong>([^<]*)<\/strong>/;
const ADDRESS_RE = /views-field-field-location-zip"><div class="field-content">([^<]*)<\/div>/;
const F1_RE = /f-1-([YN])/;
const M1_RE = /m-1-([YN])/;
const STATE_RE = /,\s*([A-Za-z]{2})\s+\d{5}/;

// Each row's regexes below (rel=, views-field-field-location-zip, etc.)
// are specific enough that a slice running a bit long into the next row
// (or, for the page's last row, into the trailing pagination/footer
// markup) still resolves correctly -- exec() finds the first, correct
// match regardless of trailing noise. No need for exact per-row closing
// boundaries.
function extractRows(html: string): string[] {
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  ROW_START_RE.lastIndex = 0;
  while ((m = ROW_START_RE.exec(html))) starts.push(m.index);
  return starts.map((start, i) => html.slice(start, i + 1 < starts.length ? starts[i + 1] : html.length));
}

function parseRow(rowHtml: string): DsoRecord | null {
  const nameMatch = NAME_RE.exec(rowHtml);
  const campusMatch = CAMPUS_RE.exec(rowHtml);
  const addressMatch = ADDRESS_RE.exec(rowHtml);
  const f1Match = F1_RE.exec(rowHtml);
  const m1Match = M1_RE.exec(rowHtml);
  if (!nameMatch) return null;

  const schoolName = unescapeTwice(nameMatch[1]).trim();
  const campusNameRaw = campusMatch ? unescapeTwice(campusMatch[2]).trim() : null;
  const fullAddress = addressMatch ? unescapeTwice(addressMatch[1]).trim() : "";

  const stateMatch = STATE_RE.exec(fullAddress);
  const state = stateMatch ? stateMatch[1].toUpperCase() : "";

  const parts = fullAddress
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const streetAddress = parts.length > 0 ? parts[0] : null;
  const cityStateZip = parts.length > 1 ? parts.slice(1).join(", ") : null;

  return {
    schoolName,
    campusName: campusNameRaw,
    isMainCampus: campusMatch ? campusMatch[1] === "Y" : false,
    f1Certified: f1Match ? f1Match[1] === "Y" : false,
    m1Certified: m1Match ? m1Match[1] === "Y" : false,
    streetAddress,
    cityStateZip,
    state,
  };
}

async function fetchPage(page: number): Promise<{ records: DsoRecord[]; total: number }> {
  const url = `${BASE_URL}?field_education_level_value=1&page=${page}`;
  const resp = await fetch(url, { headers: FETCH_HEADERS });
  if (!resp.ok) throw new Error(`DSO school search fetch returned ${resp.status} for page ${page}`);
  const html = await resp.text();

  const totalMatch = /id="results-total">([\d,]+)</.exec(html);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ""), 10) : 0;

  const rows = extractRows(html);
  const records = rows.map(parseRow).filter((r): r is DsoRecord => r !== null && r.state.length === 2);
  return { records, total };
}

export interface DsoFetchResult {
  records: DsoRecord[];
  declaredTotal: number;
}

export async function fetchAllDsoSchools(): Promise<DsoFetchResult> {
  const first = await fetchPage(0);
  const declaredTotal = first.total;
  const totalPages = Math.max(1, Math.ceil(declaredTotal / PAGE_SIZE));

  const allRecords: DsoRecord[] = [...first.records];

  // Modest concurrency -- a government site, not worth hammering, and
  // ~100 pages sequentially would risk the 300s function timeout.
  const CONCURRENCY = 6;
  const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
  let next = 0;
  async function worker() {
    while (next < pageNumbers.length) {
      const page = pageNumbers[next++];
      const { records } = await fetchPage(page);
      allRecords.push(...records);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pageNumbers.length) }, worker));

  return { records: allRecords, declaredTotal };
}
