// Round 14 — Settings page's links/resources hub. Plain, hand-curated
// external links (same "curated, not scraped" reasoning as the KB files) —
// each URL live-verified via a real browser-like fetch before shipping
// (egov.uscis.gov and travel.state.gov both sit behind a Cloudflare bot
// challenge that blocks a plain server-side request, same as documented
// elsewhere in this project — that's expected and not a broken link, a
// real browser passes it fine).

import { OFFICE_LOCATOR_URL, ASC_LOCATOR_URL, PROCESSING_TIMES_SOURCE_URL } from "@/lib/kb/processing-times";
import { VISA_BULLETIN_SOURCE_URL } from "@/lib/kb/visa-bulletin";

export interface ResourceLink {
  id: string;
  label: string;
  description: string;
  url: string;
}

export const RESOURCE_LINKS: ResourceLink[] = [
  {
    id: "case-status",
    label: "Check case status directly on USCIS",
    description: "USCIS's own case-status tool — the same source CaseWhy's tracker reads from.",
    url: "https://egov.uscis.gov/casestatus/landing.do",
  },
  {
    id: "processing-times",
    label: "Official processing-time estimates",
    description: "USCIS's own tool, searchable by your specific form and office.",
    url: PROCESSING_TIMES_SOURCE_URL,
  },
  {
    id: "visa-bulletin",
    label: "Visa Bulletin (Dept. of State)",
    description: "Monthly priority-date cutoffs for family- and employment-based categories.",
    url: VISA_BULLETIN_SOURCE_URL,
  },
  {
    id: "all-forms",
    label: "All USCIS forms",
    description: "Official, current versions of every USCIS form — always use these, never a copy.",
    url: "https://www.uscis.gov/forms/all-forms",
  },
  {
    id: "field-office-locator",
    label: "Find your field office",
    description: "Look up the USCIS field office tied to your case.",
    url: OFFICE_LOCATOR_URL,
  },
  {
    id: "asc-locator",
    label: "Find your Application Support Center",
    description: "For biometrics appointments.",
    url: ASC_LOCATOR_URL,
  },
  {
    id: "ombudsman",
    label: "USCIS Ombudsman — case assistance",
    description: "Where CaseWhy Plus's Ombudsman escalation letter template actually gets sent.",
    url: "https://www.dhs.gov/case-assistance",
  },
  // Round 24 — 7 more, prompted by a competitor's resources page. Each
  // live-verified with a real browser before shipping; 3 of the 7 URLs
  // Peter's own concept doc suggested turned out to be real 404s (not the
  // usual Cloudflare-block false alarm) — corrected URLs below, not the
  // originally-suggested ones.
  {
    id: "civil-surgeon-locator",
    label: "Find a Civil Surgeon",
    description: "Doctors authorized to do your USCIS medical exam (Form I-693).",
    url: "https://www.uscis.gov/tools/find-a-civil-surgeon",
  },
  {
    id: "ar-11-change-of-address",
    label: "Change your address with USCIS (AR-11)",
    description: "Required within 10 days of moving — a common miss that causes missed notices.",
    url: "https://www.uscis.gov/addresschange",
  },
  {
    id: "aos-filing-charts",
    label: "Adjustment of Status Filing Charts",
    description: "Which Visa Bulletin table (Final Action Dates or Dates for Filing) currently applies for filing an I-485.",
    url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin",
  },
  {
    id: "case-inquiry",
    label: "Case Inquiry (E-Request)",
    description: "Formally ask USCIS about a case that's outside normal processing times.",
    url: "https://egov.uscis.gov/e-request/",
  },
  {
    id: "cbp-i94",
    label: "I-94 arrival/departure record",
    description: "CBP's lookup tool — relevant if your case depends on your last entry date or current status.",
    url: "https://i94.cbp.dhs.gov/I94/#/home",
  },
  {
    id: "civics-test-study",
    label: "Civics test study materials",
    description: "Official study resources for the N-400 civics and English test.",
    url: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/study-for-the-test",
  },
  {
    id: "myuscis-appointment",
    label: "Schedule an in-person appointment",
    description: "myUSCIS's appointment scheduler (formerly branded \"InfoPass\").",
    url: "https://my.uscis.gov/en/appointment/v2",
  },
];
