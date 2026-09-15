// Round 90 — sources for the policy/news watcher (distinct from
// src/lib/news/sources.ts, which drives the public /news page and its
// per-user Settings checkboxes). Deliberately its own small config rather
// than importing NEWS_SOURCES: this watcher needs sources /news doesn't
// show (Policy Memoranda, Policy Manual updates) and doesn't need /news's
// per-user defaultOn/settings concept at all — every source here is always
// polled. A little URL duplication with sources.ts (uscis, fr-uscis,
// fr-dhs) is preferable to coupling two features with different shapes.
//
// Every URL below was live-verified with a real server-side fetch before
// being added, not guessed (the codebase's standing rule, e.g.
// processing-times.ts / rss-client.ts's own notes):
//  - USCIS Policy Memoranda: the task doc's own guessed URL
//    (.../policy-memoranda-service-center-operations, and a couple other
//    guesses) all 404'd. Found the real page by navigating from
//    uscis.gov/laws-and-policy (not guessing further), which links
//    /laws-and-policy/policy-memoranda — that page itself exposes a real
//    RSS feed via <link rel="alternate" type="application/rss+xml">,
//    confirmed with real memo entries (PM-602-... documents).
//  - USCIS Policy Manual updates: no RSS feed exists on this page (checked
//    the page's own <link rel="alternate"> tags — only a plain hreflang
//    entry, no rss+xml one). The page itself has a clean, dated list of
//    updates in real markup ( <time datetime="..."> immediately followed
//    by a /policy-manual-updates/<date>-<Slug> link), confirmed by fetching
//    it directly — scraped via news-watcher/scrape-policy-manual.ts rather
//    than left out, since the structure is genuinely stable/parseable, not
//    a guess at hidden markup.
//  - Federal Register — State: confirmed the "state-department" agency
//    slug is correct against a real 200 response with real State
//    Department documents (same api.federalregister.gov pattern already
//    verified for DHS/USCIS in src/lib/news/sources.ts).
//
// Two sources from the task doc's own list were checked and NOT included,
// same "verify, don't guess, drop what doesn't work" standard as round 17
// dropping MPI and round 73 dropping VisaJourney/Trackitt:
//  - CourtListener: the task doc asks for "immigration-related dockets,"
//    but CourtListener's public, unauthenticated RSS search is a full-text
//    search across ALL filings, not a docket-scoped feed — querying even
//    an exact case name ("Texas v. United States" DACA) returned entries
//    from completely unrelated cases (a Tim Walz prosecution turned up in
//    a DACA-scoped query, because some unrelated filing's citations list
//    happened to mention DACA-adjacent sources). Precise docket-level
//    tracking needs CourtListener's authenticated REST API (confirmed:
//    unauthenticated requests get a real 401), which needs an API token
//    Peter doesn't have yet — added to his one-time checklist below rather
//    than shipping a source that could hand a wrong case to the drafting
//    step, which SOCIAL_MEDIA_GUARDRAILS.md Section 4's "sourcing over
//    speed" rule exists specifically to prevent.
//  - AILA public news page: no RSS link found on either the news page
//    (404, the task doc's own URL) or the homepage (checked both directly,
//    no <link rel="alternate" type="application/rss+xml"> present on
//    either). Left out per the same standard as MPI in round 17.

export type WatcherSourceType = "rss" | "federal-register" | "policy-manual-scrape";

export interface WatcherSource {
  id: string;
  name: string;
  url: string;
  type: WatcherSourceType;
}

export const WATCHER_SOURCES: WatcherSource[] = [
  {
    id: "uscis-newsroom",
    name: "USCIS Newsroom",
    url: "https://www.uscis.gov/news/rss-feed/59144",
    type: "rss",
  },
  {
    id: "policy-memoranda",
    name: "USCIS Policy Memoranda",
    url: "https://www.uscis.gov/news/rss-feed/23734",
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
    id: "fr-state",
    name: "Federal Register — State Department",
    url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=state-department&per_page=20&order=newest",
    type: "federal-register",
  },
  {
    id: "policy-manual-updates",
    name: "USCIS Policy Manual Updates",
    url: "https://www.uscis.gov/policy-manual/updates",
    type: "policy-manual-scrape",
  },
];
