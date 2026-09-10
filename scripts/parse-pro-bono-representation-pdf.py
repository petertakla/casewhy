# Round 58 — column-aware parser for EOIR's "List of Pro Bono Legal Service
# Providers" PDF (justice.gov/eoir/file/probonofulllist/download). The
# source is a genuinely two-column, gap-flowing layout (not delimiter-
# based) where naive pdfplumber extract_text() interleaves adjacent
# organizations mid-word — see CLOUD_CLAUDE.md "Round 58" for the real bugs
# found and fixed while building this (column-split heuristic, state-page
# detection, Fax lines overwriting real Tel numbers, bullet-continuation
# swallowing the next org's name).
#
# Usage:
#   curl -sL -A "Mozilla/5.0 ..." "https://www.justice.gov/eoir/file/probonofulllist/download" -o /tmp/probono.pdf
#   python3 scripts/parse-pro-bono-representation-pdf.py
#   (writes /tmp/probono_parsed.json — copy into scripts/data/ before seeding)

import pdfplumber
import re
import json
import sys

STATE_NAMES = {
    "ALABAMA","ALASKA","ARIZONA","ARKANSAS","CALIFORNIA","COLORADO","CONNECTICUT",
    "DELAWARE","FLORIDA","GEORGIA","HAWAII","IDAHO","ILLINOIS","INDIANA","IOWA",
    "KANSAS","KENTUCKY","LOUISIANA","MAINE","MARYLAND","MASSACHUSETTS","MICHIGAN",
    "MINNESOTA","MISSISSIPPI","MISSOURI","MONTANA","NEBRASKA","NEVADA",
    "NEW HAMPSHIRE","NEW JERSEY","NEW MEXICO","NEW YORK","NORTH CAROLINA",
    "NORTH DAKOTA","OHIO","OKLAHOMA","OREGON","PENNSYLVANIA","PUERTO RICO",
    "RHODE ISLAND","SOUTH CAROLINA","SOUTH DAKOTA","TENNESSEE","TEXAS","UTAH",
    "VERMONT","VIRGINIA","WASHINGTON","WEST VIRGINIA","WISCONSIN","WYOMING",
    "DISTRICT OF COLUMBIA",
}
STATE_ABBR = {
    "ALABAMA":"AL","ALASKA":"AK","ARIZONA":"AZ","ARKANSAS":"AR","CALIFORNIA":"CA",
    "COLORADO":"CO","CONNECTICUT":"CT","DELAWARE":"DE","FLORIDA":"FL","GEORGIA":"GA",
    "HAWAII":"HI","IDAHO":"ID","ILLINOIS":"IL","INDIANA":"IN","IOWA":"IA",
    "KANSAS":"KS","KENTUCKY":"KY","LOUISIANA":"LA","MAINE":"ME","MARYLAND":"MD",
    "MASSACHUSETTS":"MA","MICHIGAN":"MI","MINNESOTA":"MN","MISSISSIPPI":"MS",
    "MISSOURI":"MO","MONTANA":"MT","NEBRASKA":"NE","NEVADA":"NV",
    "NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ","NEW MEXICO":"NM","NEW YORK":"NY",
    "NORTH CAROLINA":"NC","NORTH DAKOTA":"ND","OHIO":"OH","OKLAHOMA":"OK",
    "OREGON":"OR","PENNSYLVANIA":"PA","PUERTO RICO":"PR","RHODE ISLAND":"RI",
    "SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD","TENNESSEE":"TN","TEXAS":"TX",
    "UTAH":"UT","VERMONT":"VT","VIRGINIA":"VA","WASHINGTON":"WA",
    "WEST VIRGINIA":"WV","WISCONSIN":"WI","WYOMING":"WY",
    "DISTRICT OF COLUMBIA":"DC",
}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"^(Tel|Phone)[:\.]?\s*(.*)", re.I)
FAX_RE = re.compile(r"^Fax[:\.]?", re.I)
WEB_RE = re.compile(r"^(www\.|https?://)", re.I)
ZIP_STATE_RE = re.compile(r",\s*([A-Za-z]{2})\s+\d{5}")

def words_to_rows(words, tol=3):
    """Group words (already filtered to one column) into rows by top proximity, sorted."""
    rows = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        placed = False
        for r in rows:
            if abs(r["top"] - w["top"]) <= tol:
                r["words"].append(w)
                r["top"] = min(r["top"], w["top"])
                placed = True
                break
        if not placed:
            rows.append({"top": w["top"], "words": [w]})
    rows.sort(key=lambda r: r["top"])
    for r in rows:
        r["words"].sort(key=lambda w: w["x0"])
        r["text"] = " ".join(w["text"] for w in r["words"])
    return rows

COLUMN_SPLIT_X = 275  # confirmed fixed 2-column boundary: left content ends ~262, right starts ~286

def split_columns(words):
    return COLUMN_SPLIT_X

ADDRESS_START_RE = re.compile(r"^\d")

def classify_row(text):
    s = text.strip()
    if s.startswith("•"):
        return "BULLET"
    if FAX_RE.match(s):
        return "FAX"
    if re.match(r"^(Tel|Phone)[:\.]", s, re.I):
        return "PHONE"
    if WEB_RE.match(s):
        return "WEBSITE"
    if EMAIL_RE.fullmatch(s):
        return "EMAIL"
    if ADDRESS_START_RE.match(s) or s.startswith("P.O.") or ZIP_STATE_RE.search(s):
        return "ADDRESS"
    return "NAME"

def group_entries(rows):
    """Split a sorted list of {top,text} rows into entry blocks. A new entry starts
    at a NAME-classified row that immediately follows a non-NAME row (or is first in
    the column) — gap-based splitting doesn't work here since intra-entry blank-line
    gaps (e.g. before a bullet list starts) are the same size as inter-entry gaps.
    Wrapped continuation lines (a bullet or address line that wraps onto a second
    physical row with no leading marker) inherit the previous row's type rather than
    being misread as a new entry's name."""
    blocks = []
    current = []
    prev_type = None
    for r in rows:
        row_type = classify_row(r["text"])
        text = r["text"].strip()
        looks_like_fragment = " " not in text and text[:1].islower()
        looks_like_real_name = bool(re.search(r"\*{1,3}\s*$", text))
        if row_type == "NAME" and prev_type in ("BULLET", "ADDRESS") and not looks_like_real_name:
            row_type = prev_type  # wrapped continuation line, not a real new entry
        elif row_type == "NAME" and prev_type == "WEBSITE" and looks_like_fragment:
            row_type = prev_type  # e.g. "immigration/" continuing a wrapped URL
        if row_type == "NAME" and prev_type is not None and prev_type != "NAME":
            if current:
                blocks.append(current)
            current = []
        current.append(r["text"])
        prev_type = row_type
    if current:
        blocks.append(current)
    return blocks

def parse_entry(lines):
    if not lines:
        return None
    name_line = lines[0]
    is_referral = "**" in name_line and "***" not in name_line
    name = re.sub(r"\*+\s*$", "", name_line).strip()
    entry = {
        "organizationName": name,
        "isReferralService": is_referral,
        "streetAddress": None,
        "cityStateZip": None,
        "phone": None,
        "email": None,
        "website": None,
        "languages": None,
        "caseTypeLimits": [],
        "intakePolicy": [],
    }
    addr_parts = []
    prev_type = "NAME"
    for line in lines[1:]:
        s = line.strip()
        if not s:
            continue
        row_type = classify_row(s)
        looks_like_fragment = " " not in s and s[:1].islower()
        looks_like_real_name = bool(re.search(r"\*{1,3}\s*$", s))
        if row_type == "NAME" and prev_type in ("BULLET", "ADDRESS") and not looks_like_real_name:
            row_type = prev_type  # wrapped continuation line
        elif row_type == "NAME" and prev_type == "WEBSITE" and looks_like_fragment:
            row_type = prev_type  # e.g. "immigration/" continuing a wrapped URL
        if row_type == "FAX":
            pass  # fax numbers aren't captured — schema only has one phone field
        elif row_type == "PHONE":
            m = PHONE_RE.match(s)
            entry["phone"] = m.group(2).strip() if m else s
        elif row_type == "EMAIL":
            entry["email"] = s
        elif row_type == "WEBSITE":
            entry["website"] = (entry["website"] + s) if entry["website"] else s
        elif row_type == "BULLET":
            bullet = s.lstrip("•").strip()
            if bullet.lower().startswith("language"):
                entry["languages"] = re.sub(r"^languages?:\s*", "", bullet, flags=re.I)
            elif "walk-in" in bullet.lower() or "walk in" in bullet.lower() or "appointment" in bullet.lower():
                entry["intakePolicy"].append(bullet)
            else:
                entry["caseTypeLimits"].append(bullet)
        elif row_type == "ADDRESS":
            if ZIP_STATE_RE.search(s):
                entry["cityStateZip"] = s
            else:
                addr_parts.append(s)
        else:  # stray NAME-classified continuation with no clear previous type
            addr_parts.append(s)
        prev_type = row_type
    if addr_parts:
        entry["streetAddress"] = ", ".join(addr_parts)
    entry["caseTypeLimits"] = "; ".join(entry["caseTypeLimits"]) or None
    entry["intakePolicy"] = "; ".join(entry["intakePolicy"]) or None
    return entry

def main(path):
    results = []
    current_state = None
    current_court = None
    with pdfplumber.open(path) as pdf:
        for pageno, page in enumerate(pdf.pages):
            if pageno < 2:
                continue  # cover page + table of contents, not real listing content
            words = page.extract_words()
            body = [w for w in words if w["top"] > 45]
            header_words = [w for w in words if w["top"] <= 45]

            # State divider page: standing header/footnote legend is on every page, so
            # check the BODY word count (top>45), not the raw page word count.
            if not body:
                continue
            if len(body) <= 5:
                candidate = " ".join(w["text"] for w in sorted(body, key=lambda w: w["x0"]))
                if candidate.strip().upper() in STATE_NAMES:
                    current_state = candidate.strip().upper()
                    continue

            # Court header: first row(s) before top=75 are "XXX Immigration Court" / "City, State (page N of M)"
            court_words = [w for w in body if w["top"] < 75]
            content_words = [w for w in body if w["top"] >= 75]
            if court_words:
                court_rows = words_to_rows(court_words, tol=4)
                court_text_lines = [r["text"] for r in court_rows]
                if court_text_lines:
                    first = court_text_lines[0]
                    if "Immigration Court" in first or "Hearing Location" in first:
                        current_court = first.strip()

            if not content_words:
                continue

            split_x = split_columns(content_words)
            left = [w for w in content_words if w["x0"] < split_x]
            right = [w for w in content_words if w["x0"] >= split_x]

            for col_words in (left, right):
                if not col_words:
                    continue
                rows = words_to_rows(col_words, tol=3)
                blocks = group_entries(rows)
                for block in blocks:
                    entry = parse_entry(block)
                    if not entry or not entry["organizationName"]:
                        continue
                    if len(entry["organizationName"]) < 3:
                        continue
                    entry["state"] = STATE_ABBR.get(current_state, current_state)
                    entry["immigrationCourt"] = current_court
                    entry["pageNumber"] = pageno + 1
                    results.append(entry)
    return results

def is_valid(entry):
    name = entry["organizationName"]
    if len(name) < 5 or " " not in name:
        return False
    if not any([entry["streetAddress"], entry["cityStateZip"], entry["phone"], entry["email"], entry["website"]]):
        return False
    return True

if __name__ == "__main__":
    out = main("/tmp/probono.pdf")
    valid = [e for e in out if is_valid(e)]
    dropped = len(out) - len(valid)
    with open("/tmp/probono_parsed.json", "w") as f:
        json.dump(valid, f, indent=2)
    print(f"Parsed {len(out)} entries, kept {len(valid)}, dropped {dropped} as unparseable fragments")
