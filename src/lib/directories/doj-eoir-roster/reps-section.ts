// Parses the DOJ EOIR roster's org-alphabetical table (org name + up to N
// individual accredited reps per org, no address) -- pages 2 through
// wherever the "Recognized Organization Address" appendix starts (see
// index.ts). Confirmed live 2026-09-19 against unpdf's `extractTextItems`
// (positioned text, x/y in PDF space) rather than pdfplumber-style table
// detection, which turned out to sidestep the two real parsing bugs the
// original Python version needed to fix by hand:
//
// 1. pdfplumber split one logical table across a page break into a
//    separate, narrower "continuation" table object -- a structural
//    artifact of ITS table-detection algorithm, not of the PDF's actual
//    content. Working from raw positioned text instead means there's no
//    such split to detect in the first place: an org's reps are just
//    whichever rows fall between this org-name row and the next one,
//    tracked with the same `currentOrg` running state whether or not a
//    page boundary happens to fall in the middle.
//
// 2. The repeated per-page header row pdfplumber picked up ("Recognized
//    Organization" | "Date Recognized" | ...) does NOT actually exist as
//    a matched header on every page's real text content, confirmed by
//    searching all 218 pages directly -- it appears exactly once, on the
//    cover page. Whatever produced that bug in the original build was
//    specific to how pdfplumber's own table extraction worked, not a
//    property of this PDF's real text -- nothing to replicate here.
//
// Row model, confirmed against real data: each rep is one "row," anchored
// by its own Representative Status cell (x~506, e.g. "Active") -- this
// cell never wraps to a second line and reliably appears exactly once per
// rep. A row's other cells span from just below the PREVIOUS row's anchor
// down to this row's anchor (inclusive), across whichever of the 7 known
// column x-ranges they fall in. Org name/Date Recognized/Expiration Date/
// Org Status are populated only on a row that starts a NEW org (DOJ's own
// display convention: org info shown once, reps listed below); when
// they're empty, the row continues `currentOrg`, carried across page
// boundaries the same way the org-name column itself does.

import { normalizeOrgName, OrgRepsRecord, parseDateWithPending, RepEntry } from "./types";

interface TextItem {
  str: string;
  x: number;
  y: number;
}

const COLUMNS = {
  org: [0, 115],
  recDate: [115, 175],
  expDate: [175, 250],
  orgStatus: [250, 330],
  repName: [330, 420],
  repExp: [420, 490],
  repStatus: [490, 1000],
} as const;

type ColumnName = keyof typeof COLUMNS;

function columnFor(x: number): ColumnName | null {
  for (const [name, [lo, hi]] of Object.entries(COLUMNS) as [ColumnName, [number, number]][]) {
    if (x >= lo && x < hi) return name;
  }
  return null;
}

function joinColumn(items: TextItem[], column: ColumnName): string | null {
  const text = items
    .filter((it) => columnFor(it.x) === column)
    .sort((a, b) => b.y - a.y)
    .map((it) => it.str.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function buildRep(items: TextItem[]): RepEntry | null {
  const rawName = joinColumn(items, "repName");
  if (!rawName) return null;
  const dhsOnly = /\(DHS [Oo]nly\)/.test(rawName);
  const name = rawName.replace(/\s*\(DHS [Oo]nly\)\s*/i, "").trim();
  const { value: expiration, pending } = parseDateWithPending(joinColumn(items, "repExp"));
  const status = joinColumn(items, "repStatus");
  return { name, dhsOnly, expiration, pendingRenewal: pending, status };
}

/** `pages` is one array of positioned text items per reps-section page (in
 * order); `currentOrgKey` state carries across all of them, matching the
 * PDF's own real org-continuation-across-page-breaks behavior (confirmed
 * live: a single org's rep list can and does span a page boundary). */
export function parseRepsSection(pages: TextItem[][]): Map<string, OrgRepsRecord> {
  const orgs = new Map<string, OrgRepsRecord>();
  let currentKey: string | null = null;

  for (const page of pages) {
    // Single bare-uppercase-letter items are alphabetical section-divider
    // markers ("A", "B", "T", ...), not real column data -- found live
    // 2026-09-19 bleeding into the orgStatus column (x-range overlaps
    // where a divider happens to land) and corrupting 9 real orgs' status
    // to "Active T" etc. No real column in this table is ever a single
    // letter, so these are safe to drop outright rather than parse around.
    const cleaned = page.filter((it) => it.str.trim() !== "" && !/^[A-Z]$/.test(it.str.trim()));
    const anchorYs = [...new Set(cleaned.filter((it) => columnFor(it.x) === "repStatus").map((it) => it.y))].sort((a, b) => b - a);

    for (let i = 0; i < anchorYs.length; i++) {
      const anchorY = anchorYs[i];
      const lowerBound = anchorYs[i + 1] ?? -Infinity;
      const rowItems = cleaned.filter((it) => it.y > lowerBound && it.y <= anchorY);

      const orgName = joinColumn(rowItems, "org");
      // The table's own header row reprints mid-table on some pages (found
      // live 2026-09-19 -- not on every page as the original Python
      // docstring assumed, but real on at least 5 of 89 reps-section
      // pages, usually right after a single-letter alphabetical section
      // divider). It's laid out as two wrapped header lines, so it
      // produces two anchor rows whose org-column text is exactly
      // "Recognized" or "Organization" (standalone, never real org names)
      // -- skip the entire row, not just the org, so its header fragments
      // in the rep columns don't get attributed anywhere either.
      if (orgName === "Recognized" || orgName === "Organization") continue;

      if (orgName) {
        const key = normalizeOrgName(orgName);
        if (key.length > 2 && !orgs.has(key)) {
          const { value: recognized } = parseDateWithPending(joinColumn(rowItems, "recDate"));
          const { value: expiration } = parseDateWithPending(joinColumn(rowItems, "expDate"));
          orgs.set(key, { name: orgName, recognized, expiration, status: joinColumn(rowItems, "orgStatus"), reps: [] });
        }
        if (key.length > 2) currentKey = key;
      }

      const rep = buildRep(rowItems);
      if (rep && currentKey && orgs.has(currentKey)) {
        orgs.get(currentKey)!.reps.push(rep);
      }
    }
  }

  return orgs;
}
