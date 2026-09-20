// Round 124 — public How-To content for the new Help Center (/help).
// Grouped by topic area (Peter's own preference: "one section for USCIS,
// another for the app, etc.") rather than one flat list. English only this
// round, matching round 120's own scoping decision for the admin side —
// the existing bilingual /faq content is unaffected (see src/app/help/
// page.tsx's own comment on why it's linked to rather than embedded here).
//
// Every href points at a real, live page — checked against the current
// app, not guessed from old task docs.

import type { HelpEntry } from "./types";

export const PUBLIC_HOWTO_ENTRIES: HelpEntry[] = [
  // -- Your USCIS case --
  {
    id: "track-first-case",
    title: "How to track your first case",
    group: "Your USCIS case",
    audience: "public",
    kind: "howto",
    href: "/dashboard",
    steps: [
      "Find your 13-character receipt number on your I-797 notice — three letters followed by ten digits (for example IOE, MSC, EAC, WAC, LIN, SRC, NBC, YSC).",
      "Enter it on the Dashboard and submit — CaseWhy looks up the current status directly from USCIS.",
      "Click \"Track this case\" to save it. Once tracked, CaseWhy checks it automatically once a day (Plus adds an on-demand \"Check now\" button) and keeps a full status history.",
    ],
  },
  {
    id: "understand-notifications",
    title: "How status-change notifications work",
    group: "Your USCIS case",
    audience: "public",
    kind: "howto",
    href: "/settings",
    steps: [
      "You get an email the day a tracked case's status changes.",
      "Turn on push notifications in Settings for an on-device alert too.",
      "On iPhone, push requires adding CaseWhy to your home screen first — Settings walks you through it.",
    ],
    notes: ["Full detail on notification setup lives in the FAQ's \"Tracking a case\" section."],
  },
  // -- Using CaseWhy --
  {
    id: "ask-casewhy",
    title: "How to ask a question with Ask CaseWhy",
    group: "Using CaseWhy",
    audience: "public",
    kind: "howto",
    href: "/get-help/ask",
    steps: [
      "Visit Get Help and open Ask CaseWhy — no sign-in needed for a few free questions.",
      "Type your question in plain language; answers are general and informational, not advice about your specific case.",
      "Sign in for a free account to get monthly questions about your own tracked case, or upgrade to Plus for unlimited questions.",
    ],
  },
  {
    id: "manage-plus",
    title: "How to upgrade to, manage, or cancel Plus",
    group: "Using CaseWhy",
    audience: "public",
    kind: "howto",
    href: "/plus",
    steps: [
      "Visit the Plus page to see current pricing and start checkout — billed securely through Stripe.",
      "Once subscribed, use the \"Manage plan\" link on the same page to change plans, update payment details, or cancel.",
      "Canceling keeps Plus access through the end of the period you've already paid for, then reverts to the free tier — nothing you've tracked or uploaded is deleted.",
    ],
  },
  {
    id: "switch-to-spanish",
    title: "How to switch the site to Spanish",
    group: "Using CaseWhy",
    audience: "public",
    kind: "howto",
    steps: [
      "Use the \"Español\" link at the top of any page to switch.",
      "Most pages have a full Spanish version; a few reference pages are still English-only and marked \"(en inglés)\" where they're linked.",
    ],
  },
  {
    id: "report-incorrect-info",
    title: "How to report incorrect information",
    group: "Using CaseWhy",
    audience: "public",
    kind: "howto",
    steps: [
      "On a Get Help directory listing (an attorney, legal aid org, etc.), use the \"See something wrong with this listing? Report it\" link on the listing's own page.",
      "For anything else — an explanation, a processing-time figure, or a general site issue — email corrections@casewhy.com directly; a person reads every message.",
    ],
  },
  // -- Reference --
  // Same grouping as the header's own "Resources" dropdown (see
  // src/lib/site/pages.ts's showInHeaderMenu entries) — processing times
  // and the visa bulletin are official government data CaseWhy surfaces
  // but doesn't control; news and policy are CaseWhy's own curated
  // coverage of developments outside its control.
  {
    id: "processing-times-tool",
    title: "How to read the processing-times tool",
    group: "Reference",
    audience: "public",
    kind: "howto",
    href: "/processing-times",
    steps: [
      "Shows USCIS's own published processing-time estimates for the case types CaseWhy tracks, by form and office.",
      "The figure shown is how long USCIS itself says it takes for 80% of cases like yours to complete — not a CaseWhy prediction.",
      "This is separate from your own tracked case's status — use it to gauge whether your case is within USCIS's normal range.",
    ],
  },
  {
    id: "visa-bulletin-tool",
    title: "How to read the Visa Bulletin",
    group: "Reference",
    audience: "public",
    kind: "howto",
    href: "/visa-bulletin",
    steps: [
      "Reflects the U.S. Department of State's own monthly Visa Bulletin — Final Action Dates for family- and employment-based categories.",
      "Find your category and country of chargeability; if the bulletin's date is later than your priority date, a visa number is currently available to you.",
      "This is the government's own published data, refreshed from the real source — not a CaseWhy estimate.",
    ],
  },
  {
    id: "immigration-news",
    title: "How to use Immigration news",
    group: "Reference",
    audience: "public",
    kind: "howto",
    href: "/news",
    steps: [
      "USCIS announcements, federal rule changes, and immigration-law coverage from a curated set of sources — updated regularly, not written by CaseWhy.",
      "Signed-in users can choose which sources appear in their own feed.",
    ],
  },
  {
    id: "policy-memos",
    title: "How to use the policy memos page",
    group: "Reference",
    audience: "public",
    kind: "howto",
    href: "/policy",
    steps: [
      "Plain-language explanations of major USCIS policy changes, memos, and court rulings that can plausibly explain why a pending case looks delayed or affected.",
      "Written once for anyone to read — not tied to any specific person's case, so check whether one plausibly applies to your own form type and dates.",
    ],
  },
  {
    id: "escalate-to-uscis",
    title: "How to escalate a stalled case directly with USCIS",
    group: "Reference",
    audience: "public",
    kind: "howto",
    steps: [
      "CaseWhy Plus automatically flags a case as outside USCIS's own normal processing time once it's waited longer than USCIS's published estimate for that form and office.",
      "At that point, the formal channels USCIS itself provides are: a USCIS e-Request, a congressional inquiry, or the CIS Ombudsman — CaseWhy shows these options directly on the case.",
      "Plus can draft those escalation letters for you, prefilled with your case's own details.",
    ],
    notes: ["These are USCIS's and DHS's own official channels, not something CaseWhy operates — CaseWhy only helps you find and prepare them."],
  },
  // -- Get help beyond CaseWhy --
  {
    id: "share-with-attorney",
    title: "How to share your case with an attorney",
    group: "Get help beyond CaseWhy",
    audience: "public",
    kind: "howto",
    href: "/plus",
    steps: [
      "Plus includes an attorney-handoff PDF: your case timeline, status history, and explanations in one document.",
      "Generate it from your tracked case and send it directly to your lawyer or accredited representative.",
      "Don't have one yet? Get Help lists free legal aid, accredited representatives, and attorneys — free to everyone, always.",
    ],
  },
  {
    id: "find-legal-help",
    title: "How to find legal help near you",
    group: "Get help beyond CaseWhy",
    audience: "public",
    kind: "howto",
    href: "/get-help",
    steps: [
      "Visit Get Help and pick a category: attorneys, DOJ-accredited representatives, free/low-cost legal aid, pro bono immigration-court representation, DSOs, or community organizations.",
      "Filter by state and search by name to narrow results.",
      "Every category is free to browse, with no sign-in required.",
    ],
  },
];
