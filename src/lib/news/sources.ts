// Round 14 — /news page feed sources. Small, hand-maintained config, same
// pattern as src/lib/kb/*.ts and src/lib/congress/representatives.ts: add,
// remove, or edit an entry here and it's immediately reflected both on
// /news and as a checkbox on /settings — no schema change needed (see
// disabledNewsSources in src/lib/db/schema.ts, which stores opt-outs by
// sourceId rather than a fixed list).
//
// All six URLs below were live-verified (Sep 6 2026) with a real server-
// side fetch, not assumed from documentation:
//  - USCIS's own "All News" feed returns 200 with a real User-Agent header
//    (an earlier pass reported a 403 here — not reproduced from this
//    network; worth rechecking if it ever starts failing from Vercel's
//    own IPs, since Cloudflare-style blocks can be IP-range-specific).
//  - The Federal Register's documented agency slug for DHS is
//    "homeland-security-department", not "department-of-homeland-security"
//    (confirmed against federalregister.gov/api/v1/agencies.json) — a
//    guessed slug from the concept doc that would have 400'd if unchecked.
//  - visalawyerblog.com/feed/ and immigrationimpact.com/feed/ both 301
//    redirect to their real feed URL; fetch()'s default redirect: "follow"
//    handles this transparently.
export type NewsSourceType = "rss" | "federal-register";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: NewsSourceType;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "uscis",
    name: "USCIS — All News",
    url: "https://www.uscis.gov/news/rss-feed/59144",
    type: "rss",
  },
  {
    id: "fr-uscis",
    name: "Federal Register — USCIS",
    url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=u-s-citizenship-and-immigration-services&per_page=20&order=newest",
    type: "federal-register",
  },
  {
    id: "fr-dhs",
    name: "Federal Register — DHS",
    url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=homeland-security-department&per_page=20&order=newest",
    type: "federal-register",
  },
  {
    id: "citizenpath",
    name: "CitizenPath Blog",
    url: "https://citizenpath.com/feed/",
    type: "rss",
  },
  {
    id: "visa-lawyer-blog",
    name: "Visa Lawyer Blog",
    url: "https://visalawyerblog.com/feed/",
    type: "rss",
  },
  {
    id: "immigration-impact",
    name: "Immigration Impact",
    url: "https://immigrationimpact.com/feed/",
    type: "rss",
  },
];
