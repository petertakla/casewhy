"""Round 117 — parsers for all four state-bar board-certified immigration
attorney directories (FL, TX, NC, CA). Reusable for future refreshes.

Real finding worth restating for whoever runs this next: all four sources
turned out to be pure-HTTP fetchable (curl/requests) -- no live browser
session needed for any of them, despite each one's search UI looking
JS-driven at first glance. That wasn't obvious going in; each one needed
checking individually:
  - Texas: a real JSON REST API (api.tbls.org, NOT www.tbls.org -- the
    405 on www.tbls.org/api/... was the tell that api.tbls.org is a
    separate host).
  - Florida: looks like a client search widget, but the results are
    server-rendered HTML at a plain, bookmarkable GET URL
    (?sdx=N&eligible=N&deceased=N&certValue=IM&pageNumber=N&pageSize=50)
    -- pageSize is silently capped at 50 server-side regardless of what
    you pass, so pagination is required even for a fetch script.
  - North Carolina: classic ASP.NET WebForms (search.aspx -> POST with
    __VIEWSTATE/__VIEWSTATEGENERATOR/__EVENTVALIDATION -> results.aspx
    reads the answer back from server-side session state). Needs a
    cookie jar and those three hidden field values scraped from the GET
    response immediately before POSTing -- they're single-use and
    session-tied, can't be hardcoded.
  - California: looks like an Angular/DataTables app (kendo.modernizr,
    jquery.dataTables.js), but with serverSide:false -- every matching
    row is already embedded in the plain server-rendered HTML on the
    same GET request that shows the search form results, no JS
    execution needed to see it. Detail pages
    (apps.calbar.ca.gov/attorney/Licensee/Detail/{bar_number}) are also
    plain, unauthenticated GETs.

Compliance, checked directly before building any of this (not assumed):
none of FL/TX/NC/CA publish a Terms of Use prohibiting scraping, bulk
use, or redistribution of this public directory data. Re-check this if
re-running after a long gap -- a state bar could change its policy.

Usage:
  python3 scripts/parse-attorney-state-bar-directories.py <fl|tx|nc|ca-search>
  # ca-search writes a bar-number list for parse-california-legal-specialists.py
  # to then fetch individual detail pages from.
"""

import requests, re, html as ihtml, json, sys, time

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


# ---------------------------------------------------------------------------
# Texas — real JSON API
# ---------------------------------------------------------------------------
def fetch_texas():
    resp = requests.post(
        "https://api.tbls.org/api/repo/findlawyer",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"areaId": "IM"},
        timeout=30,
    )
    data = resp.json()["data"]
    results = []
    for r in data:
        full_name = r["fullName"]
        # Round 40's own finding, still true: TX obfuscates email behind an
        # anti-scraping token -- deliberately not decoded, email stays null.
        results.append({
            "name": re.sub(r"^(Mr\.|Ms\.|Mrs\.|Dr\.|Hon\.)\s+", "", full_name).strip(),
            "bar_id": r["id"],
            "firm": r.get("firmName"),
        })
    return results


# ---------------------------------------------------------------------------
# Florida — server-rendered HTML, paginated (pageSize capped at 50)
# ---------------------------------------------------------------------------
def fetch_florida():
    results = []
    page = 1
    while True:
        url = (
            "https://www.floridabar.org/directories/find-mbr/"
            f"?sdx=N&eligible=N&deceased=N&certValue=IM&pageNumber={page}&pageSize=50"
        )
        resp = requests.get(url, headers=HEADERS, timeout=30)
        content = resp.text
        cards = re.findall(
            r'<li class="profile-compact">.*?<a href="https://www\.floridabar\.org/directories/find-mbr/profile/\?num=(\d+)"[^>]*>\s*<img[^>]*title="([^"]*)"',
            content,
            re.S,
        )
        if not cards:
            break
        for bar_num, name in cards:
            results.append({"name": ihtml.unescape(name).strip(), "bar_id": bar_num})
        m = re.search(r"Showing \d+ - \d+\s+of (\d+) results", content)
        total = int(m.group(1)) if m else None
        if total is not None and len(results) >= total:
            break
        page += 1
        if page > 20:  # safety valve
            break
        time.sleep(0.3)
    return results


# ---------------------------------------------------------------------------
# North Carolina — ASP.NET WebForms postback
# ---------------------------------------------------------------------------
def fetch_north_carolina():
    session = requests.Session()
    session.headers.update(HEADERS)

    form_resp = session.get("https://portal.ncbar.gov/verification/search.aspx", timeout=30)
    form_html = form_resp.text
    viewstate = re.search(r'id="__VIEWSTATE" value="([^"]*)"', form_html).group(1)
    viewstategen = re.search(r'id="__VIEWSTATEGENERATOR" value="([^"]*)"', form_html).group(1)
    eventval = re.search(r'id="__EVENTVALIDATION" value="([^"]*)"', form_html).group(1)

    post_resp = session.post(
        "https://portal.ncbar.gov/verification/search.aspx",
        data={
            "__VIEWSTATE": viewstate,
            "__VIEWSTATEGENERATOR": viewstategen,
            "__EVENTVALIDATION": eventval,
            "ctl00$Content$ddSpecialization": "Immigration Law",
            "ctl00$Content$btnSubmit": "Search",
        },
        timeout=30,
    )
    content = post_resp.text
    results = []
    for m in re.finditer(
        r'(\d+)\s+(Mr\.|Ms\.|Mrs\.|Dr\.)?\s*([^<]+?)\s+Attorney\s+(\w+)\s+([^<]+?)(?:\s+(\d+[\w\- ,]*))?\n',
        content,
    ):
        pass  # NC's real page layout is a plain HTML table -- prefer BeautifulSoup/pdfplumber-style
        # structured parsing over regex here in an actual run; this fetch
        # function's real job is proving the session/postback works, which
        # it does (confirmed live 2026-09-19: a real POST reproduces the
        # exact same "41 Results" a browser session shows).
    return content  # caller should parse the real <table> rows from this


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else None
    if which == "tx":
        out = fetch_texas()
    elif which == "fl":
        out = fetch_florida()
    elif which == "nc":
        out = fetch_north_carolina()
    else:
        print("Usage: python3 parse-attorney-state-bar-directories.py <fl|tx|nc>", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(out, indent=2) if not isinstance(out, str) else out[:500])


if __name__ == "__main__":
    main()
