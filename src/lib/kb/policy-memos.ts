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
  /**
   * Case-status text/description/history substrings (lowercase) that make
   * this entry plausibly relevant. An empty array means "always relevant
   * whenever formTypes matches" (round 21 — used for form-specific reference
   * entries like I-131's, which apply regardless of status wording).
   */
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
  // Round 21 — form-specific reference entries for the 4 newly-supported
  // case types. Each always applies to its own formType (statusKeywords: []
  // — see textMatches()) rather than being conditional on status wording,
  // since these are background facts about the form itself, not about a
  // particular status update.
  {
    id: "i90-green-card-renewal",
    title: "I-90 Green Card Renewal/Replacement — What Changes and What Doesn't",
    datePublished: "2026-01-01",
    formTypes: ["I-90"],
    statusKeywords: [],
    summary:
      "An I-90 renews an expiring/expired card, replaces a lost/stolen/damaged one, or updates a card after a name or other change. USCIS recommends filing up to 6 months before expiration. As of this writing, USCIS extends an expired card's validity by 36 months (up from a prior 24-month extension) for I-9/employment-verification purposes when the expired card is presented together with the I-90 filing receipt notice.",
    currentStatus:
      "An I-90 is a renewal, not a re-adjudication of permanent-resident eligibility — status doesn't change while pending, assuming the person remains an LPR in good standing. It is not the right form for someone with an actual abandonment-of-residence concern (e.g., extended time outside the U.S.) — that's a different, more serious question than a routine renewal, and should go to an attorney.",
    sourceTitle: "USCIS: Extension of Green Card Validity to 36 Months for Renewals",
    sourceUrl:
      "https://www.uscis.gov/newsroom/alerts/uscis-extends-green-card-validity-extension-to-36-months-for-green-card-renewals",
  },
  {
    id: "i131-travel-document-abandonment",
    title: "I-131 Travel Documents — the Advance Parole Abandonment Risk",
    datePublished: "2026-01-01",
    formTypes: ["I-131"],
    statusKeywords: [],
    summary:
      "I-131 covers three distinct purposes: Advance Parole (for pending I-485 applicants or certain other categories needing permission to travel and return), a Re-entry Permit (for LPRs planning a trip of a year or more), and a Refugee Travel Document (for refugees/asylees) — these should never be conflated with each other.",
    currentStatus:
      "The single highest-stakes fact, from USCIS's own I-131 page: filing to request an advance parole document and departing the U.S. without that document valid for the entire trip means USCIS considers the I-131 abandoned — and for a pending I-485 applicant specifically, an unauthorized departure risks the underlying adjustment application too, not just the travel document. Any explanation touching a pending advance-parole case must carry this caveat explicitly, never softened, and must never suggest travel is safe before an advance parole document is approved and physically in hand.",
    sourceTitle: "USCIS: I-131, Application for Travel Document",
    sourceUrl: "https://www.uscis.gov/i-131",
  },
  {
    id: "n600-certificate-of-citizenship",
    title: "N-600 Certificate of Citizenship — Acquisition vs. Derivation",
    datePublished: "2026-01-01",
    formTypes: ["N-600"],
    statusKeywords: [],
    summary:
      "N-600 covers two distinct pathways: acquisition (was a U.S. citizen automatically at birth abroad through a citizen parent — no age limit to request proof) and derivation (became a citizen automatically as a minor under the Child Citizenship Act of 2000, generally requiring the child to have been under 18, an LPR, and in the legal and physical custody of a U.S.-citizen parent at the time that parent naturalized).",
    currentStatus:
      "N-600 doesn't confer citizenship — someone who qualifies is already a citizen by operation of law; the form only requests the government's proof document. It is not the right form for an LPR intending to naturalize (that's N-400), someone born in the U.S. (a birth certificate suffices), or someone already naturalized as an adult (a Certificate of Naturalization, not N-600). Processing time varies widely by service center.",
    sourceTitle: "USCIS: N-600, Application for Certificate of Citizenship",
    sourceUrl: "https://www.uscis.gov/n-600",
  },
  {
    id: "i765-employment-authorization",
    title: "I-765 Employment Authorization — the Eligibility Category Matters",
    datePublished: "2026-01-01",
    formTypes: ["I-765"],
    statusKeywords: [],
    summary:
      "The underlying eligibility category — a code like (c)(9) pending adjustment, (c)(8) pending asylum, (a)(5) granted asylee, (c)(33) DACA, (c)(3)(B)/(c)(3)(C) F-1 OPT/STEM, (a)(3)/(a)(4) paroled refugee/refugee, etc. — matters more than \"I-765\" as a label, since it reflects why someone can work, tied to a different underlying status/application per category. Status vocabulary (received, biometrics, approved, card produced) is generic across categories, but what an approval means, and how long the resulting EAD is valid, depends on the category.",
    currentStatus:
      "Never guess or assume a specific eligibility category from the form alone — if the underlying basis isn't known from the case's own facts, keep any explanation general rather than asserting a category that may be wrong.",
    sourceTitle: "USCIS: Employment Authorization Document",
    sourceUrl: "https://www.uscis.gov/employment-authorization",
  },
  // Round 22 — I-129 (a genuinely new user population: nonimmigrant/temporary
  // workers, not the green-card/citizenship track) and I-751 (deferred from
  // round 21, the natural next step for the family-based population CaseWhy
  // already serves).
  {
    id: "i129-h1b-portability",
    title: "I-129 Nonimmigrant Worker Petitions — H-1B Portability and Its Limits",
    datePublished: "2026-01-01",
    formTypes: ["I-129"],
    statusKeywords: [],
    summary:
      "I-129 covers many distinct nonimmigrant worker classifications — H-1B, L-1, O-1, TN, E-1/E-2, R-1, P-1, and others — which behave differently under the hood; never assume which classification a case is without it being independently confirmed. For H-1B specifically, AC21 portability means someone can generally start working for a new employer as soon as a new or transfer I-129 petition is properly filed and receipted, not upon approval — provided they're maintaining valid H-1B status (or within the 60-day post-employment grace period), the new employer has a certified Labor Condition Application and is paying prevailing wage, and there's no history of unauthorized work.",
    currentStatus:
      "If the new petition is later denied, work authorization under it ends immediately — this is a real, high-stakes fact that should never be softened or left implied when portability comes up.",
    sourceTitle: "H-1B Transfer and Portability Under AC21",
    sourceUrl: "https://www.lighthousehq.com/blog/h1b-transfer",
  },
  {
    id: "i751-removing-conditions-deadline",
    title: "I-751 — the 90-Day Filing Window and What Happens If You Miss It",
    datePublished: "2026-01-01",
    formTypes: ["I-751"],
    statusKeywords: [],
    summary:
      "A joint I-751 petition must generally be filed within the 90 days immediately before the 2-year conditional permanent resident card's expiration date. Waiver categories exist for filing without the other spouse and without that 90-day window restriction: divorce, death of the spouse, abuse during the marriage, or extreme hardship.",
    currentStatus:
      "Missing the 90-day window is a real, serious consequence, not a soft deadline: conditional resident status automatically terminates, and USCIS can initiate removal (deportation) proceedings. Late filing is only possible with a written good-cause explanation, and approval isn't guaranteed — state this plainly, never softened, whenever a case is approaching that window. The fraud-suspicion/interview branch and the abuse-waiver branch both carry real emotional and legal stakes — keep any guidance procedural and general (how the waiver process generally works), never an assessment of a specific person's own eligibility or likelihood of success.",
    sourceTitle: "I-751, Petition to Remove Conditions on Residence",
    sourceUrl: "https://duevisa.com/blog/i751-removal-of-conditions",
  },
  // Round 23 — I-589 (asylum) and I-821D (DACA), the two highest-stakes
  // case types added so far. Built per Peter's explicit Sep 8 direction to
  // go all-in on both while erring strictly on the side of safety — see the
  // matching hard-rule guardrails in explain.ts/chat.ts, deliberately
  // stricter here than any other form type. Facts re-verified fresh at
  // build time (Sep 8, 2026) against the same sources cited below, not
  // carried over unverified from the prior day's research. This round is
  // not "done" until Peter has personally reviewed this content and the
  // real guardrail-test transcripts.
  {
    id: "i589-asylum-basics",
    title: "I-589 Asylum — Filing Deadline, Affirmative vs. Defensive, and Work Authorization Timing",
    datePublished: "2026-01-01",
    formTypes: ["I-589"],
    statusKeywords: [],
    summary:
      "Must generally file within one year of arrival in the U.S., with exceptions for changed circumstances materially affecting eligibility, or extraordinary circumstances that caused the filing delay — real, case-specific exceptions, not a flat rule, and never something to assess without an attorney. Affirmative asylum (filed directly with a USCIS asylum office) and defensive asylum (raised as a defense in removal proceedings before an immigration judge, under EOIR — not USCIS at all) are on completely different processes and timelines. These must never be conflated.",
    currentStatus:
      "As of September 2026, the standing rule is roughly a 150-day wait after filing before applying for an initial Employment Authorization Document (some sources describe it as 180 days, depending on which point in the process is measured — present this as approximate, not exact). A DHS rule proposed February 23, 2026 would extend this wait to 365 days, add a biometrics requirement, add new eligibility bars, and let USCIS pause new EAD applications entirely once asylum processing exceeds 180 days — re-confirmed September 8, 2026 directly against the Federal Register's own record: this remains a proposed rule, not finalized (comment period closed April 24, 2026, has not cleared OMB review). Never state the 365-day figure as current. This population is also exactly who the EO 14161 social-media-vetting policy targets — keep guidance strictly procedural and factual, never speculative about an individual's outcome or risk.",
    sourceTitle: "USCIS — I-589, Application for Asylum and for Withholding of Removal",
    sourceUrl: "https://www.uscis.gov/i-589",
  },
  {
    id: "i821d-daca-current-status",
    title: "I-821D DACA — Renewals Only, Litigation Status Genuinely Unresolved",
    datePublished: "2026-01-01",
    formTypes: ["I-821D"],
    statusKeywords: [],
    summary:
      "As of this writing (re-confirmed September 8, 2026), USCIS is processing renewals only for people who already have DACA — it is not accepting or processing any new initial applications. Someone without existing DACA genuinely cannot obtain it right now; never imply otherwise or suggest a path to a first-time application.",
    currentStatus:
      "DACA's legal status is actively contested. The Fifth Circuit ruled January 17, 2025 (Texas v. United States) that deferred action itself — protection from deportation — is constitutional and can apply nationwide, but that DACA's work-authorization component may be unlawful and severable from the rest of the program. The case was remanded to the district court (Judge Hanen) to issue a modified order; as of this writing no modified order has been issued — the work-authorization question is genuinely still open, not settled either way. The narrowed injunction from the ruling applies only to Texas. Roughly 120,000 DACA renewal applications were pending as of mid-2026, the highest number on record — real risk of a recipient's protection or work authorization lapsing between renewal cycles, through no fault of their own. Never predict how or when the litigation will resolve.",
    sourceTitle: "National Immigration Forum — Current Status of DACA: Explainer",
    sourceUrl: "https://forumtogether.org/article/current-status-of-daca-explainer/",
  },
];

function textMatches(memo: PolicyMemo, haystack: string): boolean {
  if (memo.statusKeywords.length === 0) return true;
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

  const matches = POLICY_MEMOS.filter((memo) => {
    if (!formTypeMatches(memo, facts.formType)) return false;
    if (memo.effectiveFrom) {
      return Boolean(facts.submittedDate && facts.submittedDate >= memo.effectiveFrom);
    }
    return textMatches(memo, haystack);
  });

  // Form-specific entries (formTypes narrowed to this exact form, e.g. the
  // I-131 abandonment-risk entry) rank ahead of broadly-applicable "*"
  // entries, so a form-specific match can't get crowded out of the top-2 cap
  // by a coincidentally-matched general one.
  matches.sort((a, b) => Number(a.formTypes === "*") - Number(b.formTypes === "*"));

  return matches.slice(0, 2);
}

// Round 63 — a real internal permalink for a policy memo (/policy/[id]),
// so relatedPolicies links (CaseChat, the dashboard explanation) point
// somewhere internal a signed-in user can copy into the chat's "paste a
// link" feature, instead of straight out to sourceUrl. No fetch needed —
// this is CaseWhy's own already-curated data.
export function findPolicyMemoById(id: string): PolicyMemo | undefined {
  return POLICY_MEMOS.find((memo) => memo.id === id);
}
