// Round 122 follow-up — parses one fiscal year's USCIS CIGP recipient PDF
// (FY2022+ format). Confirmed by direct inspection (unpdf's extractTextItems
// dumped to raw x/y positions) that this source is NOT the two-column,
// word-fragmenting layout the pro-bono PDF or DOJ roster have to fight —
// it's a plain single-column flow with a fixed per-entry sequence:
// org name line(s), then "Location: City, ST", then "Award: $X,XXX", then
// free-flowing description lines until the next org name. Confirmed against
// FY2024's real PDF: exactly 43 "Location:" lines, matching USCIS's own
// public "43 organizations" figure for that year (checked externally, not
// assumed) -- the anomaly guard in index.ts uses this same "Location:" count
// as its per-year expected total.

import { getDocumentProxy, extractTextItems } from "unpdf";
import { FETCH_HEADERS } from "./types";

interface Row {
  y: number;
  text: string;
}

function itemsToRows(items: { str: string; x: number; y: number }[]): Row[] {
  const sorted = [...items].filter((it) => it.str.trim() !== "").sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - it.y) < 2) {
      last.text += it.str;
    } else {
      rows.push({ y: it.y, text: it.str });
    }
  }
  return rows;
}

const LOCATION_RE = /^Location:\s*(.+)$/;
const AWARD_RE = /^Award:\s*\$?([\d,]+)/;
const CITY_STATE_RE = /^(.+),\s*([A-Za-z]{2})$/;

interface ParsedEntry {
  organizationName: string;
  cityStateZip: string;
  state: string;
  description: string;
}

export async function parseCigpPdf(buf: Uint8Array): Promise<ParsedEntry[]> {
  const pdf = await getDocumentProxy(buf);
  const { items, totalPages } = await extractTextItems(pdf);

  // Every page's footer (page number + "FYxx Individual Program
  // Descriptions", both at the same y so they merge into one row) sits at
  // the bottom of every page's rows once sorted top-to-bottom -- confirmed
  // by direct inspection, not assumed. Strip it before it can bleed into
  // whichever entry's description happens to be open across a page break.
  const PAGE_FOOTER_RE = /^\d+\s*FY\d{2}\s*Individual Program Descriptions$/i;

  const allRows: string[] = [];
  for (let p = 0; p < totalPages; p++) {
    for (const row of itemsToRows(items[p])) {
      const text = row.text.trim();
      if (text && !PAGE_FOOTER_RE.test(text)) allRows.push(text);
    }
  }

  const entries: ParsedEntry[] = [];
  let current: ParsedEntry | null = null;
  let descLines: string[] = [];

  function flush() {
    if (current) {
      current.description = descLines.join(" ").replace(/\s+/g, " ").trim();
      entries.push(current);
    }
    current = null;
    descLines = [];
  }

  // One-row lookahead: a row is only ever an org name if the row right
  // after it is "Location: ...". Without this, the name row gets
  // consumed as the tail of the *previous* entry's description before
  // its role as the *next* entry's name is known.
  for (let i = 0; i < allRows.length; i++) {
    const text = allRows[i];
    const next = allRows[i + 1];

    if (next && LOCATION_RE.test(next)) {
      // `text` is this upcoming entry's name -- do not add it to the
      // entry still being built.
      continue;
    }

    const locMatch = LOCATION_RE.exec(text);
    if (locMatch) {
      flush();
      const name = allRows[i - 1] ?? "";
      const cityState = locMatch[1].trim();
      const csMatch = CITY_STATE_RE.exec(cityState);
      current = {
        organizationName: name,
        cityStateZip: cityState,
        state: csMatch ? csMatch[2].toUpperCase() : "",
        description: "",
      };
      continue;
    }

    if (AWARD_RE.test(text)) continue; // no award-amount column in the schema

    if (current !== null) descLines.push(text);
  }
  flush();

  return entries.filter((e) => e.organizationName.length > 2 && e.state.length === 2);
}

export async function fetchCigpLandingPageAndParse(landingPageUrl: string): Promise<ParsedEntry[]> {
  const pageResp = await fetch(landingPageUrl, { headers: FETCH_HEADERS });
  if (!pageResp.ok) throw new Error(`CIGP landing page fetch returned ${pageResp.status}: ${landingPageUrl}`);
  const html = await pageResp.text();

  const hrefMatch = /href="([^"]+\.pdf)"/i.exec(html);
  if (!hrefMatch) throw new Error(`No PDF link found on CIGP landing page: ${landingPageUrl}`);
  const pdfUrl = hrefMatch[1].startsWith("http") ? hrefMatch[1] : `https://www.uscis.gov${hrefMatch[1]}`;

  const pdfResp = await fetch(pdfUrl, { headers: FETCH_HEADERS });
  if (!pdfResp.ok) throw new Error(`CIGP PDF fetch returned ${pdfResp.status}: ${pdfUrl}`);
  const buf = new Uint8Array(await pdfResp.arrayBuffer());

  return parseCigpPdf(buf);
}
