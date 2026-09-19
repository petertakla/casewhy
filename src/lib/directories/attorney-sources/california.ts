// The State Bar of California's Certified Legal Specialist search
// (Immigration & Nationality Law, LegalSpecialty=05). Contrary to round
// 117's original assumption (a live browser was used the first time,
// reading the DataTable's own JS data), this is genuinely a plain GET --
// confirmed live 2026-09-19 by watching the real request a browser submit
// fires: it must include every AdvancedSearch field name (LastNameOption=b
// etc.), even empty, or the controller silently returns zero rows. Every
// matching row (a few hundred) is embedded directly in that one response's
// HTML, no pagination needed for the fetch itself (the DataTable only
// paginates the on-page *display*). Each result's own detail page
// (Licensee/Detail/{bar_number}) is a second, plain unauthenticated GET.

import { AttorneySourceRecord, FETCH_HEADERS, mapWithConcurrency } from "./types";

const SOURCE_CITATION_PREFIX = "Sourced from the State Bar of California's Certified Legal Specialist directory (apps.calbar.ca.gov), pulled";

const SEARCH_URL =
  "https://apps.calbar.ca.gov/attorney/LicenseeSearch/AdvancedSearch?" +
  "LastNameOption=b&LastName=&FirstNameOption=b&FirstName=&MiddleNameOption=b&MiddleName=&" +
  "FirmNameOption=b&FirmName=&CityOption=b&City=&State=&Zip=&District=&County=&" +
  "LegalSpecialty=05&LanguageSpoken=&PracticeArea=";

const ROW_RE = /<a href="\/attorney\/Licensee\/Detail\/(\d+)">([^<]*)<\/a>/g;

const DISC_KEYWORDS = /Actual Suspension|Stayed Suspension|Public Reproval|Private Reproval|Disbarr|Probation|Involuntary Inactive/i;
// \b required on BOTH sides of ICE -- an unanchored, case-insensitive "ICE"
// matches inside "Office" (found live 2026-09-19, see round 117's own
// notes on this exact bug in scripts/parse-california-legal-specialists.py).
const GOV_ADDRESS =
  /USCIS|Office of Chief Counsel|Immigration Court|Dept\.? of Homeland|\bDHS\b|\bICE\b|Executive Office for Immigration|\bEOIR\b|Public Defender/i;

function parseSearchResults(html: string): { barNumber: string; name: string }[] {
  const results: { barNumber: string; name: string }[] = [];
  for (const m of html.matchAll(ROW_RE)) {
    // The search table lists "Last , First Middle" (heavily whitespace-
    // padded); reorder to "First Middle Last" to match every other
    // state's convention in this directory.
    const raw = m[2].replace(/\s+/g, " ").trim();
    const [last, rest] = raw.split(",").map((s) => s.trim());
    const name = rest ? `${rest} ${last}` : last;
    results.push({ barNumber: m[1], name });
  }
  return results;
}

interface CaDetail {
  status: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  hasDiscipline: boolean;
}

async function fetchDetail(barNumber: string): Promise<CaDetail | null> {
  const resp = await fetch(`https://apps.calbar.ca.gov/attorney/Licensee/Detail/${barNumber}`, { headers: FETCH_HEADERS });
  if (!resp.ok) return null;
  const html = await resp.text();

  const nameBlockStart = html.indexOf("<!-- Begin: Name and status -->");
  if (nameBlockStart === -1) return null;
  const nameBlockEnd = html.indexOf("<!-- End: Name and status -->", nameBlockStart);
  const nameBlock = html.slice(nameBlockStart, nameBlockEnd);

  const statusMatch = /License Status:\s*([A-Za-z ]+?)\s*<\/b>/.exec(nameBlock);
  const status = statusMatch ? statusMatch[1].trim() : null;

  const profileStart = html.indexOf("<!-- Begin: Profile Info -->", nameBlockEnd);
  let profileEnd = profileStart !== -1 ? html.indexOf("<!-- End: Hardcoded", profileStart) : -1;
  if (profileStart !== -1 && profileEnd === -1) profileEnd = profileStart + 3000;
  const profileBlock = profileStart !== -1 ? html.slice(profileStart, profileEnd) : "";

  const addrMatch = /Address:\s*([\s\S]*?)\s*<\/p>/.exec(profileBlock);
  const address = addrMatch
    ? addrMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : null;

  const phoneMatch = /Phone:\s*([\d\-() ]+)/.exec(profileBlock);
  const phone = phoneMatch ? phoneMatch[1].trim() : null;

  const websiteMatch = /Website:\s*<a[^>]*>([^<]*)<\/a>/.exec(profileBlock);
  const website = websiteMatch ? websiteMatch[1].trim() : null;

  const chargesIdx = html.indexOf('id="chargeslink"');
  let hasDiscipline = false;
  if (chargesIdx !== -1) {
    const tbodyStart = html.indexOf("<tbody>", chargesIdx);
    const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
    const tbody = tbodyStart !== -1 ? html.slice(tbodyStart, tbodyEnd) : "";
    hasDiscipline = DISC_KEYWORDS.test(tbody);
  }

  return { status, address, phone: phone || null, website: website || null, hasDiscipline };
}

const US_STATES =
  "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC";
const CITY_STATE_ZIP_RE = new RegExp(`^(.*?),\\s*([A-Za-z .'-]+,\\s*(?:${US_STATES})\\s+\\d{5}(?:-\\d{4})?)$`);

// Firm name routinely contains its own commas ("Manulkin, Tanner and
// Associates"), so this only splits off the trailing city/state/zip and
// leaves the firm name folded into streetAddress rather than attempting an
// unreliable further split -- same call scripts/parse-california-legal-
// specialists.py made. Addresses that don't match (a handful of
// international addresses) are left whole in streetAddress.
function splitAddress(address: string): { streetAddress: string; cityStateZip: string | null } {
  const m = CITY_STATE_ZIP_RE.exec(address);
  if (!m) return { streetAddress: address, cityStateZip: null };
  return { streetAddress: m[1].trim(), cityStateZip: m[2].trim() };
}

export async function fetchCaliforniaAttorneys(pullDate: string): Promise<AttorneySourceRecord[]> {
  const resp = await fetch(SEARCH_URL, { headers: FETCH_HEADERS });
  if (!resp.ok) throw new Error(`California Bar search returned ${resp.status}`);
  const html = await resp.text();
  const listRows = parseSearchResults(html);
  const sourceCitation = `${SOURCE_CITATION_PREFIX} ${pullDate}.`;

  const detailed = await mapWithConcurrency(listRows, 10, async (row) => {
    const detail = await fetchDetail(row.barNumber);
    return { row, detail };
  });

  const records: AttorneySourceRecord[] = [];
  for (const { row, detail } of detailed) {
    if (!detail || detail.status !== "Active") continue;
    if (detail.hasDiscipline) continue;
    if (detail.address && GOV_ADDRESS.test(detail.address)) continue;

    const { streetAddress, cityStateZip } = detail.address ? splitAddress(detail.address) : { streetAddress: null, cityStateZip: null };

    records.push({
      name: row.name,
      firm: null, // CA's detail page folds firm name into the address block, not a separate field -- same as round 117's original pull
      state: "CA",
      barNumber: row.barNumber,
      practiceFocus: "Board Certified - Immigration & Nationality Law",
      websiteUrl: detail.website,
      phone: detail.phone,
      email: null, // no email field on CA's detail page
      streetAddress,
      cityStateZip,
      sourceCitation,
    });
  }
  return records;
}
