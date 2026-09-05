// CW-31 v1 — curated policy/case-law knowledge base.
//
// A deliberately small, hand-picked set of major, well-documented USCIS
// policy changes that plausibly explain *why* a case is delayed or affected
// in a way the raw status text never says outright. Each entry is sourced
// from USCIS's own site or, where the primary document isn't machine-
// readable (a scanned/compressed PDF), from multiple independent legal-news
// sources describing the same primary document — see `sourceUrl` on each.
//
// Scope deliberately kept to the handful of entries most relevant to the
// three case types CaseWhy supports (N-400, family-based green cards,
// employment-based cases) and — per the MVP scope doc's own framing, and
// Peter's own case — the policy his family's naturalization was actually
// affected by. This is not meant to be comprehensive; growing it is future
// editorial work, not an engineering task.
//
// IMPORTANT, and why matching here is deliberately conservative: nothing in
// USCIS's Case Status API response reveals *why* a case is delayed (that's
// the whole reason CaseWhy exists), and the API never returns the
// applicant's country of birth/nationality — so this KB can never *confirm*
// a specific policy applies to a specific case, only surface it as
// plausible background. `explainCaseStatus()` is responsible for framing
// any matched entry this way, never as a diagnosis — see the system
// instructions there.

export interface PolicyMemo {
  id: string;
  title: string;
  memoNumber?: string;
  datePublished: string; // ISO date the policy was issued/announced
  /** Case-status text/description/history substrings (lowercase) that make this entry plausibly relevant. */
  statusKeywords: string[];
  /** Form types this applies to, or "*" for broadly applicable. */
  formTypes: string[] | "*";
  /** Only surface this entry for cases filed/submitted on or after this date (for date-gated rule changes). */
  effectiveFrom?: string;
  summary: string;
  currentStatus: string;
  sourceTitle: string;
  sourceUrl: string;
}

export const POLICY_MEMOS: PolicyMemo[] = [
  {
    id: "pm-602-0194-high-risk-hold",
    title: "Hold and Review of Benefit Applications from Additional High-Risk Countries",
    memoNumber: "PM-602-0194",
    datePublished: "2026-01-01",
    formTypes: "*",
    statusKeywords: [
      "additional review",
      "actively reviewed",
      "administrative processing",
      "extended review",
      "further review",
    ],
    summary:
      "Effective January 1, 2026, USCIS placed an automatic hold on final decisions for pending benefit applications — including naturalization, family-based and employment-based petitions, adjustment of status, and work permits — filed by nationals of about 39 countries designated 'high-risk' (tied to Presidential Proclamations 10949 and 10998). It also directed re-review of certain approvals granted on or after January 20, 2021 for nationals of those countries. USCIS gave no timeline for lifting individual holds, so an affected case could show no visible status change for an extended period with no explanation in the status text itself.",
    currentStatus:
      "Federal courts in Massachusetts and Rhode Island found the hold policies likely unlawful under the Administrative Procedure Act in spring 2026, and a Rhode Island court vacated them outright on June 5, 2026; a Texas court issued a related class-wide order on August 24, 2026 directing USCIS to resume normal processing for affected applicants. Relief has generally applied to certified classes/plaintiffs rather than automatically to every case nationwide, so whether a specific case has actually resumed normal processing isn't something this app can confirm from the status API alone.",
    sourceTitle: "USCIS Policy Alert PM-602-0194 (Jan 1, 2026)",
    sourceUrl:
      "https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0194-PendingApplicationsAdditionalHighRiskCountries-20260101.pdf",
  },
  {
    id: "public-charge-2026",
    title: "2026 Public Charge Inadmissibility Guidance",
    datePublished: "2026-07-16",
    effectiveFrom: "2026-09-18",
    formTypes: ["I-485"],
    statusKeywords: ["public charge", "affidavit of support", "form i-864"],
    summary:
      "DHS finalized a rule (published July 20, 2026, effective September 18, 2026) rescinding the 2022 public-charge regulations. Under the new guidance, USCIS officers may weigh receipt of essentially any means-tested public benefit (not just cash assistance or long-term institutionalization, as under the prior rule) when deciding whether an adjustment-of-status applicant is likely to become a public charge, alongside the five statutory factors (age, health, family status, assets/resources/financial status, education/skills) and the Form I-864 affidavit of support. The new guidance also introduces public-charge bonds — a financial guarantee an applicant can post to overcome an otherwise-inadmissible finding.",
    currentStatus:
      "In effect as of September 18, 2026. Applications postmarked or e-filed before that date are still adjudicated under the prior, narrower framework.",
    sourceTitle: "USCIS: Guidance on Making a Public Charge Inadmissibility Determination",
    sourceUrl:
      "https://www.uscis.gov/newsroom/alerts/uscis-issues-guidance-on-making-public-charge-inadmissibility-determination",
  },
  {
    id: "rfe-noid-adjudicative-principles",
    title: "When USCIS Issues a Request for Evidence vs. Denies Outright",
    datePublished: "2021-06-09",
    formTypes: "*",
    statusKeywords: [
      "request for evidence",
      "notice of intent to deny",
      "rfe",
      "noid",
    ],
    summary:
      "A 2018 policy (PM-602-0050.1) gave officers discretion to deny an application outright, without first issuing a Request for Evidence (RFE) or Notice of Intent to Deny (NOID), whenever required initial evidence was missing — a real, if temporary, tightening of when applicants got a chance to respond before a denial. That policy was rescinded January 20, 2021, and on June 9, 2021 USCIS reverted to the longer-standing adjudicative principle (dating to June 2013): officers should issue an RFE or NOID, giving the applicant a chance to submit more evidence, whenever additional evidence could plausibly establish eligibility, rather than denying outright.",
    currentStatus:
      "This is the current operative standard — USCIS issuing an RFE or NOID generally means the officer believes the case could still be approved with more evidence, not that the case is in jeopardy.",
    sourceTitle: "USCIS Notice to Appear Policy Memorandum history (archived)",
    sourceUrl: "https://www.uscis.gov/archive/notice-to-appear-policy-memorandum",
  },
];

function textMatches(memo: PolicyMemo, haystack: string): boolean {
  return memo.statusKeywords.some((kw) => haystack.includes(kw));
}

function formTypeMatches(memo: PolicyMemo, formType: string): boolean {
  return memo.formTypes === "*" || memo.formTypes.includes(formType.toUpperCase());
}

export interface CaseFactsForMatching {
  formType: string;
  statusText: string;
  statusDescription: string;
  historyText: string;
  submittedDate?: string;
}

/**
 * Find KB entries plausibly relevant to a case, purely by form type + keyword
 * overlap with the case's own status text/history, or a filing-date cutoff
 * for date-gated rule changes. Deliberately conservative — see file header.
 * Capped to 2 entries so the prompt stays small and the model isn't tempted
 * to pad the explanation with every tangentially-matched policy.
 */
export function findRelevantPolicyContext(facts: CaseFactsForMatching): PolicyMemo[] {
  const haystack = `${facts.statusText} ${facts.statusDescription} ${facts.historyText}`.toLowerCase();

  return POLICY_MEMOS.filter((memo) => {
    if (!formTypeMatches(memo, facts.formType)) return false;
    if (memo.effectiveFrom) {
      return Boolean(facts.submittedDate && facts.submittedDate >= memo.effectiveFrom);
    }
    return textMatches(memo, haystack);
  }).slice(0, 2);
}
