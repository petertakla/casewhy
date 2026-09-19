"""Round 117 — parser for the State Bar of California's Certified Legal
Specialist directory (Immigration & Nationality Law). Reusable for future
refreshes; also serves as documentation of the real, non-obvious mechanics
this source needed the first time it was seeded.

Confirmed via the ABA's own State Sources of Certification directory
(americanbar.org/groups/specialization/state-sources-of-certification/)
that California is a fourth state with a real, state-bar-administered
"board certified specialist" immigration-law program, alongside FL/TX/NC
(the only three found in the original Sep 9, 2026 research). Checked
calbar.ca.gov's own Notices/User Policies page directly before building
this — no scraping/bulk-use/redistribution restriction found, same
conclusion as FL/TX/NC.

How the search results page works (apps.calbar.ca.gov/attorney/
LicenseeSearch/AdvancedSearch?...&LegalSpecialty=05&...): it's a
client-side jQuery DataTable with serverSide:false -- ALL matching rows
are already embedded in the page on load, just paginated for display.
This script drives a real browser (via Claude in Chrome) to submit that
search, then reads the DataTable's own JS data directly (`$('#tblAttorney')
.DataTable().rows().data()`) rather than scraping the rendered DOM text --
gets clean (bar_number, name, status, city) tuples for every result in one
shot, no per-page-of-50 pagination needed. That step isn't automatable
from this standalone script (needs the live browser session) -- run it
first, save the resulting bar-number list to a text file, then run this
script to fetch + parse each individual detail page.

Each individual attorney's own profile
(apps.calbar.ca.gov/attorney/Licensee/Detail/{bar_number}) IS plain HTTP-
fetchable with no session/cookies needed (confirmed) and contains the real
address/phone/website plus a real disciplinary-history table. Two real
parsing pitfalls found and fixed here:
  1. The page's "License Status:" label appears twice -- once in the real
     summary block, once as the disciplinary-history table's own heading
     ("License Status, Disciplinary and Administrative History"). Anchor
     on the "<!-- Begin: Name and status -->" HTML comment instead of the
     label text, which is unambiguous.
  2. The Website field's real URL is the link's TEXT, not its `href`
     (`href="#" onclick="showExitWindow();..."` -- an exit-interstitial
     pattern). Read the anchor's inner text, not the href attribute.

Two real editorial exclusions applied (not just parsed-and-shipped):
  - Any entry with a real disciplinary action on record (Actual/Stayed
    Suspension, Reproval, Disbarment, Probation) in the table's own
    <tbody> -- same standard already applied to NC's two exclusions.
  - Any entry whose listed office is a government address (USCIS, an
    immigration court, a public defender's office) -- these are not
    privately retainable and, for USCIS/immigration-court entries,
    represent the opposing side in a removal proceeding. Listing them
    as a "find help" resource would be actively misleading. Regex here
    needs \\b on BOTH sides of "ICE" -- an unanchored case-insensitive
    "ICE" matches the substring inside "Office" (found live, Sep 19).

Usage:
  1. In a live browser session on the AdvancedSearch results page
     (LegalSpecialty=05 = Immigration & Nationality Law), run:
       const dt = $('#tblAttorney').DataTable(); dt.page.len(-1).draw();
       dt.rows().data().toArray().map(r => {
         const div = document.createElement('div'); div.innerHTML = r[0];
         return div.querySelector('a').getAttribute('href').split('/').pop();
       }).join('\\n')
     Save the output (one bar number per line) to a file.
  2. python3 scripts/parse-california-legal-specialists.py <bar-numbers-file>
     (writes /tmp/ca_legal_specialists_parsed.json)
"""

import requests, re, html as ihtml, time, json, sys

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
DISC_KEYWORDS = re.compile(
    r"Actual Suspension|Stayed Suspension|Public Reproval|Private Reproval|Disbarr|Probation|Involuntary Inactive",
    re.I,
)
GOV_ADDRESS = re.compile(
    r"USCIS|Office of Chief Counsel|Immigration Court|Dept\.? of Homeland|\bDHS\b|\bICE\b|"
    r"Executive Office for Immigration|\bEOIR\b|Public Defender",
    re.I,
)
US_STATES = (
    "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|"
    "NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC"
)
CITY_STATE_ZIP = re.compile(rf"^(.*?),\s*([A-Za-z .\'-]+,\s*(?:{US_STATES})\s+\d{{5}}(?:-\d{{4}})?)$")


def fetch_one(bar_number: str) -> dict | None:
    url = f"https://apps.calbar.ca.gov/attorney/Licensee/Detail/{bar_number}"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        return None
    content = resp.text

    name_block_idx = content.find("<!-- Begin: Name and status -->")
    if name_block_idx == -1:
        return None
    name_block_end = content.find("<!-- End: Name and status -->", name_block_idx)
    name_block = content[name_block_idx:name_block_end]

    name_m = re.search(r"<b>\s*(.*?)\s*#(\d+)\s*</b>", name_block, re.S)
    if not name_m:
        return None
    name_raw = re.sub(r"\s+", " ", ihtml.unescape(name_m.group(1))).strip()

    status_m = re.search(r"License Status:\s*([A-Za-z ]+?)\s*</b>", name_block)
    status = status_m.group(1).strip() if status_m else None

    profile_idx = content.find("<!-- Begin: Profile Info -->", name_block_end)
    profile_end = content.find("<!-- End: Hardcoded", profile_idx) if profile_idx != -1 else -1
    if profile_end == -1 and profile_idx != -1:
        profile_end = profile_idx + 3000
    profile_block = content[profile_idx:profile_end] if profile_idx != -1 else ""

    addr_m = re.search(r"Address:\s*(.*?)\s*</p>", profile_block, re.S)
    address = None
    if addr_m:
        address = re.sub(r"<[^>]+>", " ", addr_m.group(1))
        address = re.sub(r"\s+", " ", ihtml.unescape(address)).strip()

    phone_m = re.search(r"Phone:\s*([\d\-\(\) ]+)", profile_block)
    phone = phone_m.group(1).strip() if phone_m else None

    website_m = re.search(r"Website:\s*<a[^>]*>([^<]*)</a>", profile_block)
    website = website_m.group(1).strip() if website_m else None

    charges_idx = content.find('id="chargeslink"')
    has_discipline = False
    if charges_idx != -1:
        tbody_start = content.find("<tbody>", charges_idx)
        tbody_end = content.find("</tbody>", tbody_start)
        tbody = content[tbody_start:tbody_end] if tbody_start != -1 else ""
        has_discipline = bool(DISC_KEYWORDS.search(tbody))

    return {
        "bar_number": bar_number,
        "name": name_raw,
        "status": status,
        "address": address,
        "phone": phone,
        "website": website,
        "has_discipline": has_discipline,
        "is_government_address": bool(address and GOV_ADDRESS.search(address)),
    }


def split_address(address: str) -> tuple[str, str]:
    """Splits a full CA Bar address string into (street_address, city_state_zip).
    Firm name (if present) stays folded into street_address rather than
    attempting an unreliable comma-based split -- firm names routinely
    contain their own commas ("Manulkin, Tanner and Associates"), so a
    naive split would mangle them. Raises on international addresses --
    handle those by hand (only 2 in the Sep 19 pull: Hong Kong, Canada)."""
    m = CITY_STATE_ZIP.match(address)
    if not m:
        raise ValueError(f"couldn't split address: {address!r}")
    return m.group(1).strip(), m.group(2).strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 parse-california-legal-specialists.py <bar-numbers-file>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1]) as f:
        bar_numbers = sorted({line.strip() for line in f if line.strip()}, key=int)

    results = []
    excluded_discipline = []
    excluded_gov = []
    for i, bn in enumerate(bar_numbers):
        rec = fetch_one(bn)
        if rec is None:
            print(f"FAILED to fetch/parse {bn}", file=sys.stderr)
            continue
        if rec["has_discipline"]:
            excluded_discipline.append(rec)
        elif rec["is_government_address"]:
            excluded_gov.append(rec)
        else:
            results.append(rec)
        if i % 40 == 0:
            print(f"...{i}/{len(bar_numbers)}", file=sys.stderr)
        time.sleep(0.12)

    print(
        f"Parsed: {len(results)} eligible, {len(excluded_discipline)} excluded (discipline), "
        f"{len(excluded_gov)} excluded (government address)",
        file=sys.stderr,
    )

    with open("/tmp/ca_legal_specialists_parsed.json", "w") as f:
        json.dump(
            {"eligible": results, "excluded_discipline": excluded_discipline, "excluded_gov": excluded_gov},
            f,
            indent=2,
        )


if __name__ == "__main__":
    main()
