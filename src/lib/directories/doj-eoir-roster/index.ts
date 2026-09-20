// Fetches and parses DOJ EOIR's "Recognized Organizations and Accredited
// Representatives Roster" PDF (a stable friendly-redirect URL that always
// serves the current version) -- feeds both accreditedRepresentativeDirectory
// and legalAidDirectory. See reps-section.ts and address-section.ts for the
// two real sub-parsers; this module fetches the PDF, splits its pages into
// the two sections, and joins them by normalized org name -- the same join
// scripts/parse-doj-eoir-roster.py did, just position-based instead of
// pdfplumber-table-based (see reps-section.ts's header comment for why that
// turned out to sidestep two real bugs rather than just relocate them).

import { getDocumentProxy, extractTextItems } from "unpdf";
import { normalizeOrgName, OrgAddressRecord, OrgRepsRecord } from "./types";
import { parseRepsSection } from "./reps-section";
import { parseAddressSection } from "./address-section";

const PDF_URL = "https://www.justice.gov/eoir/page/file/942301/download";
const ADDRESS_HEADER = "Recognized Organization Address";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface JoinedOrg {
  reps: OrgRepsRecord;
  address: OrgAddressRecord | null;
}

export interface DojEoirResult {
  joined: JoinedOrg[];
  addressOnly: OrgAddressRecord[]; // in the address appendix, but currently zero reps on file -- real orgs, but their status can't be verified from this source (see seed-legal-aid-orgs.ts's own exclusion precedent)
  reportDate: string | null; // the roster's own "Report Last Updated on:" date, printed on its cover page
  declaredOrgCount: number | null; // the roster's own "Number of Recognized Organizations:" figure, for sanity-checking the parse against
}

function pageStartsWithAddressHeader(page: { str: string; x: number; y: number }[]): boolean {
  const top = [...page]
    .filter((it) => it.str.trim() !== "")
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .slice(0, 3)
    .map((it) => it.str.trim())
    .join(" ");
  return top.startsWith(ADDRESS_HEADER);
}

export async function fetchAndParseDojEoirRoster(): Promise<DojEoirResult> {
  const resp = await fetch(PDF_URL, { headers: FETCH_HEADERS });
  if (!resp.ok) throw new Error(`DOJ EOIR roster PDF fetch returned ${resp.status}`);
  const buf = new Uint8Array(await resp.arrayBuffer());

  const pdf = await getDocumentProxy(buf);
  const { items, totalPages } = await extractTextItems(pdf);
  if (totalPages < 3) throw new Error(`DOJ EOIR roster PDF only had ${totalPages} pages -- expected 200+`);

  const coverText = [...items[0]].sort((a, b) => b.y - a.y || a.x - b.x).map((it) => it.str).join(" ");
  const reportDateMatch = /Report Last Updated on:?\s*([\d/]+)/i.exec(coverText);
  const declaredOrgCountMatch = /Number of Recognized Organizations:\s*(\d+)/i.exec(coverText);
  const reportDate = reportDateMatch ? reportDateMatch[1] : null;
  const declaredOrgCount = declaredOrgCountMatch ? parseInt(declaredOrgCountMatch[1], 10) : null;

  let addressStart = -1;
  for (let p = 1; p < totalPages; p++) {
    if (pageStartsWithAddressHeader(items[p])) {
      addressStart = p;
      break;
    }
  }
  if (addressStart === -1) throw new Error("DOJ EOIR roster PDF: couldn't find the address appendix's start page");

  const repsPages = items.slice(1, addressStart); // skip page 1, the cover page
  const addressPages = items.slice(addressStart);

  const orgs = parseRepsSection(repsPages);
  const addresses = parseAddressSection(addressPages);

  const addrByNorm = new Map<string, OrgAddressRecord>();
  for (const addr of addresses.values()) addrByNorm.set(normalizeOrgName(addr.name), addr);

  const joined: JoinedOrg[] = [];
  for (const org of orgs.values()) {
    joined.push({ reps: org, address: addrByNorm.get(normalizeOrgName(org.name)) ?? null });
  }

  const orgKeys = new Set(orgs.keys());
  const addressOnly = [...addresses.values()].filter((addr) => !orgKeys.has(normalizeOrgName(addr.name)));

  return { joined, addressOnly, reportDate, declaredOrgCount };
}
