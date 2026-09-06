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
];
