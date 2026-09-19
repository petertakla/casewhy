// Texas Board of Legal Specialization — real JSON REST API, confirmed live
// again 2026-09-19 (same host scripts/parse-attorney-state-bar-directories.py
// used for round 117's re-pull). Two real endpoints, not one: the search
// list (POST /api/repo/findlawyer) only gives name+firm, so each result's
// full address/phone/website comes from a second per-record call (GET
// /api/repo/findlawyerbubbledata/{mid}) -- round 40's own original build
// used both, this port does too. Texas obfuscates email behind a base64-
// looking token that isn't the standard, publicly-documented Cloudflare
// scheme (see florida.ts) -- deliberately left undecoded, same round-40
// call carried forward: email stays null.

import { AttorneySourceRecord, FETCH_HEADERS, mapWithConcurrency } from "./types";

const SOURCE_CITATION_PREFIX =
  "Sourced from the Texas Board of Legal Specialization's Find a Board Certified Lawyer directory (tbls.org), pulled";

interface TblsSearchRecord {
  id: number;
  fullName: string;
  firmName?: string | null;
}

interface TblsBubbleData {
  barId?: number | null;
  add1?: string | null;
  add2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  website?: string | null;
}

async function fetchBubbleData(mid: number): Promise<TblsBubbleData | null> {
  const resp = await fetch(`https://api.tbls.org/api/repo/findlawyerbubbledata/${mid}`, { headers: FETCH_HEADERS });
  if (!resp.ok) return null;
  const json = (await resp.json()) as { failed: boolean; data?: TblsBubbleData };
  return json.failed ? null : (json.data ?? null);
}

// TBLS's own website field genuinely ships a doubled scheme for some
// records ("http://https://realsite.com/") -- found live 2026-09-19, not
// a fluke of one record (the one-off SQL fix applied earlier this round
// would just reappear on the next automated refresh without this).
function normalizeWebsite(url: string): string {
  return url.replace(/^https?:\/\/(?=https?:\/\/)/, "");
}

export async function fetchTexasAttorneys(pullDate: string): Promise<AttorneySourceRecord[]> {
  const resp = await fetch("https://api.tbls.org/api/repo/findlawyer", {
    method: "POST",
    headers: { ...FETCH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ areaId: "IM" }),
  });
  if (!resp.ok) throw new Error(`Texas TBLS API returned ${resp.status}`);
  const json = (await resp.json()) as { data: TblsSearchRecord[] };

  const sourceCitation = `${SOURCE_CITATION_PREFIX} ${pullDate}.`;

  return mapWithConcurrency(json.data, 8, async (r) => {
    const bubble = await fetchBubbleData(r.id);
    const streetAddress = bubble?.add1 ? [bubble.add1, bubble.add2].filter(Boolean).join(", ") : null;
    const cityStateZip = bubble?.city && bubble?.state && bubble?.zip ? `${bubble.city}, ${bubble.state} ${bubble.zip}` : null;

    const record: AttorneySourceRecord = {
      name: r.fullName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Hon\.)\s+/, "").trim(),
      firm: r.firmName?.trim() || null,
      state: "TX",
      barNumber: bubble?.barId != null ? String(bubble.barId) : null,
      practiceFocus: "Board Certified - Immigration and Nationality Law",
      websiteUrl: bubble?.website?.trim() ? normalizeWebsite(bubble.website.trim()) : null,
      phone: bubble?.phone?.trim() || null,
      email: null,
      streetAddress,
      cityStateZip,
      sourceCitation,
    };
    return record;
  });
}
