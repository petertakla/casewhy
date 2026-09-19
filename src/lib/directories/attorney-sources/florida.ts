// The Florida Bar's Find a Lawyer directory — plain, bookmarkable
// server-rendered HTML, paginated (pageSize silently capped at 50
// server-side regardless of what's requested). Confirmed live again
// 2026-09-19. Each result card embeds firm/address/phone/email directly
// (no separate detail-page fetch needed, unlike Texas/NC/CA) -- email is
// Cloudflare's standard "email protection" obfuscation (a public,
// documented, reversible scheme), decoded via decodeCloudflareEmail.

import { AttorneySourceRecord, FETCH_HEADERS, decodeCloudflareEmail } from "./types";

const SOURCE_CITATION_PREFIX = "Sourced from The Florida Bar's Immigration and Nationality Law certification directory (floridabar.org), pulled";
const MAX_PAGES = 20; // safety valve against an unbounded loop if the "total" text ever fails to parse

const CARD_RE = /<li class="profile-compact">([\s\S]*?)<\/li>/g;
const NAME_RE = /<p class="profile-name"><a[^>]*>([^<]*)<\/a>/;
const BAR_NUM_RE = /Bar #(\d+)/;
const CONTACT_RE = /<div class="profile-contact">\s*<p>([\s\S]*?)<\/p>\s*<p>\s*Office:\s*<a[^>]*>([^<]*)<\/a>/;
const CF_EMAIL_RE = /data-cfemail="([0-9a-f]+)"/;
const CITY_STATE_ZIP_RE = /^(.+,\s*FL\s+[\d-]+)$/;

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#160;|&nbsp;/g, " ")
    .trim();
}

function parseCard(card: string): AttorneySourceRecord | null {
  const nameMatch = NAME_RE.exec(card);
  if (!nameMatch) return null;
  const name = unescapeHtml(nameMatch[1]);

  const barMatch = BAR_NUM_RE.exec(card);
  const barNumber = barMatch ? barMatch[1] : null;

  let firm: string | null = null;
  let streetAddress: string | null = null;
  let cityStateZip: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;

  const contactMatch = CONTACT_RE.exec(card);
  if (contactMatch) {
    const addressLines = contactMatch[1]
      .split(/<br\s*\/?>/i)
      .map((l) => unescapeHtml(l))
      .filter(Boolean);
    phone = unescapeHtml(contactMatch[2]) || null;

    const lastLine = addressLines[addressLines.length - 1];
    if (lastLine && CITY_STATE_ZIP_RE.test(lastLine)) {
      cityStateZip = lastLine;
      const rest = addressLines.slice(0, -1);
      if (rest.length >= 2) {
        firm = rest[0];
        streetAddress = rest.slice(1).join(", ");
      } else if (rest.length === 1) {
        streetAddress = rest[0];
      }
    }
  }

  const cfMatch = CF_EMAIL_RE.exec(card);
  if (cfMatch) email = decodeCloudflareEmail(cfMatch[1]);

  return {
    name,
    firm,
    state: "FL",
    barNumber,
    practiceFocus: "Board Certified - Immigration and Nationality Law",
    websiteUrl: null,
    phone,
    email,
    streetAddress,
    cityStateZip,
    sourceCitation: "", // filled in by the caller, which knows the pull date
  };
}

export async function fetchFloridaAttorneys(pullDate: string): Promise<AttorneySourceRecord[]> {
  const sourceCitation = `${SOURCE_CITATION_PREFIX} ${pullDate}.`;
  const results: AttorneySourceRecord[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://www.floridabar.org/directories/find-mbr/?sdx=N&eligible=N&deceased=N&certValue=IM&pageNumber=${page}&pageSize=50`;
    const resp = await fetch(url, { headers: FETCH_HEADERS });
    if (!resp.ok) throw new Error(`Florida Bar directory returned ${resp.status} on page ${page}`);
    const html = await resp.text();

    let sawCard = false;
    for (const m of html.matchAll(CARD_RE)) {
      sawCard = true;
      const parsed = parseCard(m[1]);
      if (parsed) results.push({ ...parsed, sourceCitation });
    }
    if (!sawCard) break;

    const totalMatch = /Showing \d+\s*-\s*\d+\s*of (\d+) results/.exec(html);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : null;
    if (total !== null && results.length >= total) break;
  }

  return results;
}
