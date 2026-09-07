// Round 14 — /news page feed sources. Small, hand-maintained config, same
// pattern as src/lib/kb/*.ts and src/lib/congress/representatives.ts: add,
// remove, or edit an entry here and it's immediately reflected both on
// /news and as a checkbox on /settings — schema changes only if a source's
// default-on status needs to change (see defaultOn below).
//
// Round 17 — Peter asked for the list rebuilt with no law-firm-branded
// sources (Visa Lawyer Blog removed; the four law-firm blogs from the
// "expand to 10" research were never added for the same reason — see
// CLOUD_CLAUDE.md round 17 for the full reasoning, including why the most
// reputable of the four, Cyrus Mehta's Insightful Immigration Blog, still
// didn't earn an exception). Only the three official/government sources
// default on for a user who's never touched Settings — see `defaultOn`.
//
// Migration Policy Institute was decided as a 7th source but could NOT be
// shipped: its RSS feed (the URL from the original research) 404s, and no
// working feed could be found anywhere on their current site — checked the
// homepage DOM, <link rel="alternate"> tags, common Drupal RSS paths,
// robots.txt, and sitemap.xml, all dead ends. Their site was likely
// redesigned since that research and RSS may no longer be exposed. Shipped
// with 6 real, verified sources instead of a 7th guessed one — re-check
// MPI later if their site changes rather than re-adding a broken URL.
//
// All URLs below were live-verified with a real server-side fetch before
// shipping, not assumed from documentation:
//  - USCIS's own "All News" feed returns 200 with a real User-Agent header
//    (an earlier pass reported a 403 here — not reproduced from this
//    network; worth rechecking if it ever starts failing from Vercel's
//    own IPs, since Cloudflare-style blocks can be IP-range-specific).
//  - The Federal Register's documented agency slug for DHS is
//    "homeland-security-department", not "department-of-homeland-security"
//    (confirmed against federalregister.gov/api/v1/agencies.json) — a
//    guessed slug from the concept doc that would have 400'd if unchecked.
//  - immigrationimpact.com/feed/ 301-redirects to its real feed URL;
//    fetch()'s default redirect: "follow" handles this transparently.
//  - redbus2us.com/feed/ confirmed live, real-time-updated RSS.
export type NewsSourceType = "rss" | "federal-register";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: NewsSourceType;
  /** Whether this source starts checked for a user who has never touched Settings. */
  defaultOn: boolean;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "uscis",
    name: "USCIS — All News",
    url: "https://www.uscis.gov/news/rss-feed/59144",
    type: "rss",
    defaultOn: true,
  },
  {
    id: "fr-uscis",
    name: "Federal Register — USCIS",
    url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=u-s-citizenship-and-immigration-services&per_page=20&order=newest",
    type: "federal-register",
    defaultOn: true,
  },
  {
    id: "fr-dhs",
    name: "Federal Register — DHS",
    url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=homeland-security-department&per_page=20&order=newest",
    type: "federal-register",
    defaultOn: true,
  },
  {
    id: "citizenpath",
    name: "CitizenPath Blog",
    url: "https://citizenpath.com/feed/",
    type: "rss",
    defaultOn: false,
  },
  {
    id: "immigration-impact",
    name: "Immigration Impact",
    url: "https://immigrationimpact.com/feed/",
    type: "rss",
    defaultOn: false,
  },
  {
    id: "redbus2us",
    name: "RedBus2US",
    url: "https://redbus2us.com/feed/",
    type: "rss",
    defaultOn: false,
  },
];
