"""Round 117 — parser for DOJ EOIR's "Recognized Organizations and
Accredited Representatives Roster" (org-alphabetical, with individual
reps) PDF. Feeds both scripts/seed-accredited-representatives.ts and
scripts/seed-legal-aid-orgs.ts. Reusable for future refreshes.

Source: https://www.justice.gov/eoir/page/file/942301/download (a stable
friendly-redirect URL that always serves the current version -- confirmed
live 2026-09-19, "Report Last Updated on: 09/13/26"). Don't confuse this
with the "by State and City" roster (a different document, with
addresses but no individual reps) -- this file's own address-appendix
section (see below) makes that second document unnecessary here.

Real structural discovery, not in the original round 29/35 build: this
PDF has TWO sections in one file, not one. Pages ~2-90 are the org-
alphabetical table (org name + up to N individual accredited reps per
org, no address). Pages ~91-218 are a second, separate "Recognized
Organization Address" appendix -- also alphabetical, org name + address
+ phone, but with ZERO reps info. Join the two by normalized org name
(strip punctuation/whitespace, lowercase) to get the full picture; don't
assume you need a second downloaded document for addresses.

Three real parsing bugs found and fixed while building this, worth
knowing about before touching this parser again:

1. pdfplumber sometimes splits ONE logical table across a page break
   into a separate, narrower table object -- a continuation table with
   only 3 columns (rep name/expiration/status) instead of the normal 7
   (org name/recognized/expiration/status/rep name/expiration/status).
   A naive `if len(row) != 7: skip` silently drops ~1200 real
   representative rows. Handle both 3-col and 7-col row shapes; a 3-col
   row continues whatever `current_org` was already set to.

2. Every PDF page repeats its own copy of the table's own header row
   ("Recognized Organization" | "Date Recognized" | ... | "Representative
   Status") as if it were real data. Naively treating this as a new org
   name creates a fake "Recognized Organization" bucket that silently
   steals ~30 real reps that should have continued under whatever the
   true previous-page org was. Explicitly skip any row where the org
   cell's cleaned text equals the literal header string "Recognized
   Organization" (case-sensitive exact match is safe here) -- and
   critically, do NOT update `current_org` when skipping it.

3. The address appendix's ZIP codes are inconsistently formatted --
   sometimes a leading zero is dropped (Vermont/New Jersey ZIPs showing
   as 4 digits), sometimes the ZIP+4 hyphen is dropped (9 digits run
   together with no separator). Zero-pad to 5 digits and only insert the
   ZIP+4 hyphen when a 4-digit suffix is actually present, rather than
   assuming a fixed-width match.

A handful of single/double-letter "org names" (section-divider artifacts,
e.g. a lone "C" page marker between organizations starting with different
letters) also show up as fake orgs with a few stray reps attached --
these get dropped outright (a small, disclosed, ~8-out-of-2600-rep loss,
not fabricated around).

Usage:
  curl -sL -A "Mozilla/5.0 ..." "https://www.justice.gov/eoir/page/file/942301/download" -o /tmp/eoir_roster.pdf
  python3 scripts/parse-doj-eoir-roster.py
  # writes /tmp/doj_eoir_joined.json: {"joined": [...], "addr_only": [...]}
  # joined = orgs with >=1 current accredited rep, address attached where found
  # addr_only = orgs in the address appendix with currently zero reps on
  #   file (real, DOJ-recognized organizations -- but their status/
  #   recognition-date can't be verified from this document since they
  #   never appear in the reps-table section at all; don't seed these
  #   into legal_aid_directory without a status, that's a real NOT NULL
  #   field and fabricating "Active" isn't ok even though it's probably
  #   true for most of them)
"""

import pdfplumber, re, json, sys

PDF_PATH = "/tmp/eoir_roster.pdf"
HEADER_ORG = "Recognized Organization"
HEADER_REP = "Accredited Representative"

US_STATES = (
    "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|"
    "NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR|VI|GU|AS|MP"
)
CITY_LINE = re.compile(rf"^(.+?),\s*({US_STATES})\s+(\d{{4,5}})(-?)(\d{{4}})?$")
PHONE_LINE = re.compile(r"^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$")


def clean(s):
    if s is None:
        return None
    return re.sub(r"\s+", " ", s.replace("\n", " ")).strip()


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def parse_reps_section(pdf):
    orgs = {}
    current_org = None

    def add_rep(rep_cell, rep_exp, rep_status):
        rep_name_raw = clean(rep_cell)
        if not rep_name_raw or rep_name_raw == HEADER_REP:
            return
        if not current_org or current_org not in orgs:
            return
        dhs_only = "(DHS only)" in rep_name_raw or "(DHS Only)" in rep_name_raw
        rep_name = re.sub(r"\s*\(DHS [Oo]nly\)\s*", "", rep_name_raw).strip()
        rep_exp_clean = clean(rep_exp)
        pending = bool(rep_exp_clean and "*" in rep_exp_clean)
        exp_only = None
        if rep_exp_clean:
            m = re.match(r"([\d/]+)\*?", rep_exp_clean)
            exp_only = m.group(1) if m else rep_exp_clean
        if rep_name:
            orgs[current_org]["reps"].append(
                {"name": rep_name, "dhs_only": dhs_only, "expiration": exp_only, "pending_renewal": pending, "status": clean(rep_status)}
            )

    addr_section_start = None
    for pnum, page in enumerate(pdf.pages[1:], start=2):
        text = page.extract_text() or ""
        if text.strip().startswith("Recognized Organization Address"):
            addr_section_start = pnum - 1  # 0-indexed
            break
        for table in page.extract_tables():
            for row in table:
                if len(row) == 7:
                    org_cell, rec_date, exp_date, org_status, rep_cell, rep_exp, rep_status = row
                    name = clean(org_cell) if org_cell else None
                    if name == HEADER_ORG:
                        continue  # repeated header row -- do NOT touch current_org
                    if name and name != "Return to the top of the page":
                        current_org = name
                        if name not in orgs:
                            orgs[name] = {"name": name, "recognized": clean(rec_date), "expiration": clean(exp_date), "status": clean(org_status), "reps": []}
                    add_rep(rep_cell, rep_exp, rep_status)
                elif len(row) == 3:
                    add_rep(*row)
        if pnum % 40 == 0:
            print(f"...reps section page {pnum}", file=sys.stderr)

    orgs.pop(HEADER_ORG, None)
    orgs = {k: v for k, v in orgs.items() if not (len(k.strip()) <= 2)}
    return orgs, addr_section_start


def parse_org_address_block(blob):
    lines = [l.strip() for l in blob.split("\n") if l.strip()]
    if not lines:
        return None
    org_name = lines[0]
    idx = 1
    office_type = None
    if idx < len(lines) and ("Office" in lines[idx]) and not CITY_LINE.match(lines[idx]):
        office_type = lines[idx]
        idx += 1
    street_lines, city, state, zip5, zip4 = [], None, None, None, None
    while idx < len(lines):
        m = CITY_LINE.match(lines[idx])
        if m:
            city, state, zip5, _, zip4 = m.groups()
            zip5 = zip5.zfill(5)
            idx += 1
            break
        street_lines.append(lines[idx])
        idx += 1
    if city is None:
        return None
    zip_full = f"{zip5}-{zip4}" if zip4 else zip5
    phone = None
    if idx < len(lines) and PHONE_LINE.match(lines[idx]):
        phone = lines[idx]
    return {
        "name": org_name,
        "office_type": office_type,
        "street_address": ", ".join(street_lines) if street_lines else None,
        "city_state_zip": f"{city}, {state} {zip_full}",
        "state": state,
        "phone": phone,
    }


def parse_address_section(pdf, start_page_idx):
    addresses = {}
    for pnum in range(start_page_idx, len(pdf.pages)):
        for table in pdf.pages[pnum].extract_tables():
            for row in table:
                if len(row) != 1 or not row[0] or row[0].strip() == "Recognized Organization Address":
                    continue
                parsed = parse_org_address_block(row[0])
                if parsed and parsed["city_state_zip"]:
                    addresses[parsed["name"]] = parsed
        if (pnum + 1) % 40 == 0:
            print(f"...address section page {pnum+1}", file=sys.stderr)
    return addresses


def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        orgs, addr_start = parse_reps_section(pdf)
        print(f"Reps-table orgs: {len(orgs)}, total reps: {sum(len(o['reps']) for o in orgs.values())}", file=sys.stderr)
        addresses = parse_address_section(pdf, addr_start)
        print(f"Address-appendix orgs: {len(addresses)}", file=sys.stderr)

    addr_by_norm = {norm(k): v for k, v in addresses.items()}
    joined = []
    for name, org in orgs.items():
        joined.append({**org, "address": addr_by_norm.get(norm(name))})

    org_norm_keys = {norm(n) for n in orgs}
    addr_only = [v for k, v in addresses.items() if norm(k) not in org_norm_keys]

    with_addr = sum(1 for j in joined if j["address"])
    print(f"Joined: {len(joined)} orgs ({with_addr} with address, {len(joined)-with_addr} without)", file=sys.stderr)
    print(f"Address-only (currently zero reps, status unverifiable): {len(addr_only)}", file=sys.stderr)

    with open("/tmp/doj_eoir_joined.json", "w") as f:
        json.dump({"joined": joined, "addr_only": addr_only}, f, indent=2)


if __name__ == "__main__":
    main()
