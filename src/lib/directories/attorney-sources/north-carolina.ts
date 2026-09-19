// North Carolina State Bar's membership directory verification portal —
// classic ASP.NET WebForms: a GET scrapes __VIEWSTATE/__VIEWSTATEGENERATOR/
// __EVENTVALIDATION, then a POST (with the same session cookie) submits the
// search and 302-redirects to results.aspx. Confirmed live again 2026-09-19,
// same "41 Results" the round 117 Python proof-of-concept reproduced --
// this port adds the real result-table parser that script left as a stub,
// plus a per-attorney detail-page fetch (viewer.aspx?ID=) for address/
// phone/email and a real disciplinary-action check (round 40's own
// standard: a board-certified attorney with a real sanction on record is
// excluded even if their bare status still reads "Active").

import { AttorneySourceRecord, FETCH_HEADERS, mapWithConcurrency } from "./types";

const SOURCE_CITATION_PREFIX =
  "Sourced from the North Carolina State Bar's membership directory, Board Certified Specialist: Immigration Law (portal.ncbar.gov), pulled";

const SEARCH_URL = "https://portal.ncbar.gov/verification/search.aspx";
const RESULTS_URL = "https://portal.ncbar.gov/verification/results.aspx";

function extractHiddenField(html: string, id: string): string {
  const m = new RegExp(`id="${id}" value="([^"]*)"`).exec(html);
  if (!m) throw new Error(`NC search form missing ${id}`);
  return m[1];
}

function extractCookie(setCookieHeaders: string[]): string {
  return setCookieHeaders.map((c) => c.split(";")[0]).join("; ");
}

async function submitSearch(): Promise<{ html: string; cookie: string }> {
  const formResp = await fetch(SEARCH_URL, { headers: FETCH_HEADERS });
  const formHtml = await formResp.text();
  const cookie = extractCookie(formResp.headers.getSetCookie?.() ?? []);

  const body = new URLSearchParams({
    __VIEWSTATE: extractHiddenField(formHtml, "__VIEWSTATE"),
    __VIEWSTATEGENERATOR: extractHiddenField(formHtml, "__VIEWSTATEGENERATOR"),
    __EVENTVALIDATION: extractHiddenField(formHtml, "__EVENTVALIDATION"),
    "ctl00$Content$ddSpecialization": "Immigration Law",
    "ctl00$Content$btnSubmit": "Search",
  });

  await fetch(SEARCH_URL, {
    method: "POST",
    headers: { ...FETCH_HEADERS, "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
    body: body.toString(),
    redirect: "manual",
  });

  const resultsResp = await fetch(RESULTS_URL, { headers: { ...FETCH_HEADERS, Cookie: cookie } });
  return { html: await resultsResp.text(), cookie };
}

interface NcListRow {
  barId: string;
  name: string;
}

function parseResultsTable(html: string): NcListRow[] {
  const tableMatch = /<table class="table table-hover">([\s\S]*?)<\/table>/.exec(html);
  if (!tableMatch) return [];
  const rows: NcListRow[] = [];
  const rowRe = /<tr>\s*<td>(\d+)<\/td>\s*<td><a href="\/Verification\/viewer\.aspx\?ID=\d+">([^<]*)<\/a><\/td>/g;
  for (const m of tableMatch[1].matchAll(rowRe)) {
    rows.push({ barId: m[1], name: m[2].replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Hon\.)\s+/, "").trim() });
  }
  return rows;
}

const DISC_TABLE_RE = /id="gvActions"[\s\S]*?<\/table>/;

async function fetchDetail(barId: string, cookie: string): Promise<{
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  hasDiscipline: boolean;
}> {
  const resp = await fetch(`https://portal.ncbar.gov/Verification/viewer.aspx?ID=${barId}`, {
    headers: { ...FETCH_HEADERS, Cookie: cookie },
  });
  const html = await resp.text();

  const get = (label: string) => {
    const m = new RegExp(`<dt>${label}:?<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`).exec(html);
    if (!m) return null;
    return m[1]
      .replace(/<br\s*\/?>/gi, ", ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const discMatch = DISC_TABLE_RE.exec(html);
  const hasDiscipline = discMatch ? (discMatch[0].match(/<tr>/g)?.length ?? 0) > 1 : false;

  return {
    address: get("Address"),
    city: get("City"),
    state: get("State"),
    zip: get("Zip Code"),
    phone: get("Work Phone"),
    email: get("Email"),
    hasDiscipline,
  };
}

export async function fetchNorthCarolinaAttorneys(pullDate: string): Promise<AttorneySourceRecord[]> {
  const { html, cookie } = await submitSearch();
  const listRows = parseResultsTable(html);
  const sourceCitation = `${SOURCE_CITATION_PREFIX} ${pullDate}.`;

  const detailed = await mapWithConcurrency(listRows, 6, async (row) => {
    const detail = await fetchDetail(row.barId, cookie);
    return { row, detail };
  });

  const records: AttorneySourceRecord[] = [];
  for (const { row, detail } of detailed) {
    if (detail.hasDiscipline) continue; // round 40's own standard — a real sanction excludes, even if status still reads "Active"

    // The Address field can be "Firm Name, Street" or just "Street" (no
    // firm on file) -- same ambiguity as Florida's card text, same
    // resolution: only split off a firm name when there's more than one
    // comma-joined segment.
    let firm: string | null = null;
    let streetAddress: string | null = null;
    if (detail.address) {
      const parts = detail.address.split(", ").filter(Boolean);
      if (parts.length >= 2) {
        firm = parts[0].replace(/,\s*$/, "").trim();
        streetAddress = parts.slice(1).join(", ").replace(/,\s*$/, "").trim();
      } else {
        streetAddress = detail.address.replace(/,\s*$/, "").trim();
      }
    }

    const cityStateZip = detail.city && detail.state && detail.zip ? `${detail.city}, ${detail.state} ${detail.zip}` : null;

    records.push({
      name: row.name,
      firm,
      state: "NC",
      barNumber: row.barId,
      practiceFocus: "Board Certified - Immigration Law",
      websiteUrl: null,
      phone: detail.phone,
      email: detail.email,
      streetAddress,
      cityStateZip,
      sourceCitation,
    });
  }
  return records;
}
