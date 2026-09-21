// Round 127 — a small, hand-curated list of real, significant immigration-
// related court decisions, modeled directly on POLICY_MEMOS
// (src/lib/kb/policy-memos.ts) rather than inventing a new shape: same
// "id/title/date/summary/currentStatus/sourceTitle/sourceUrl" convention,
// same /[id] permalink pattern, same Resources-menu placement.
//
// Checked before hand-curating from scratch: round 90's news-watcher
// investigated CourtListener as a source (src/lib/marketing/news-watcher/
// sources.ts) and found its unauthenticated RSS search returns unrelated
// cases (a full-text search, not a docket-scoped feed) -- it was never
// added to WATCHER_SOURCES. No usable candidate feed exists to seed this
// from; every entry below was independently verified via live search
// against the real opinion or a primary-source aggregator (CourtListener,
// Justia, the Court's own site), not recalled from training data alone.
//
// Scope kept to real rulings relevant to case types CaseWhy actually
// supports (see policy-memos.ts's own scope note) -- not a comprehensive
// immigration-law casebook. Three of these are the same real rulings
// already referenced in prose inside POLICY_MEMOS entries (the DACA and
// Circumvention of Lawful Pathways litigation) -- promoted to their own
// permalinks here and cross-linked, rather than existing only as an
// unlinkable mention.
//
// Hand-maintained, not an automated pipeline, per Peter's own explicit
// scoping call -- same starting point as POLICY_MEMOS (3 entries) and
// NEWS_SOURCES both began as a small hand-edited list. If this should
// auto-update later, that's a follow-up round, not assumed here.

export interface CourtRuling {
  id: string;
  caseName: string;
  citationOrDocket: string;
  court: string;
  decidedDate: string; // ISO date
  /** Which USCIS forms this ruling is most relevant to, or "*" for broadly applicable. Same convention as PolicyMemo.formTypes. */
  formTypes: string[] | "*";
  summary: string;
  currentStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  /** Cross-link to a related POLICY_MEMOS entry id, when this ruling is discussed there too. */
  relatedPolicyMemoId?: string;
}

export const COURT_RULINGS: CourtRuling[] = [
  {
    id: "texas-v-united-states-2025",
    caseName: "Texas v. United States",
    citationOrDocket: "No. 23-40653 (5th Cir.)",
    court: "U.S. Court of Appeals for the Fifth Circuit",
    decidedDate: "2025-01-17",
    formTypes: ["I-821D"],
    summary:
      "The Fifth Circuit held that deferred action itself — protection from removal — is a constitutional exercise of DHS's discretion and can apply nationwide, but that DACA's work-authorization component may exceed DHS's statutory authority and is severable from the rest of the program. The case was remanded to the district court (Judge Hanen, S.D. Tex.) to issue a modified order consistent with that holding.",
    currentStatus:
      "As of this writing, no modified district-court order has issued — whether and how work authorization for current DACA recipients is ultimately affected remains genuinely unresolved. The narrowed injunction from this ruling applies only within Texas; current recipients elsewhere can still apply to renew. Never predict how or when this will resolve.",
    sourceTitle: "Justia: Texas v. United States, No. 23-40653 (5th Cir. 2025)",
    sourceUrl: "https://law.justia.com/cases/federal/appellate-courts/ca5/23-40653/23-40653-2025-01-17.html",
    relatedPolicyMemoId: "i821d-daca-current-status",
  },
  {
    id: "dhs-v-regents-2020",
    caseName: "Department of Homeland Security v. Regents of the University of California",
    citationOrDocket: "No. 18-587, 591 U.S. 1 (2020)",
    court: "Supreme Court of the United States",
    decidedDate: "2020-06-18",
    formTypes: ["I-821D"],
    summary:
      "The Supreme Court held 5–4 that DHS's 2017 decision to rescind DACA was \"arbitrary and capricious\" under the Administrative Procedure Act, because DHS failed to consider reliance interests built up by DACA recipients over the program's several years and failed to consider a narrower rescission (ending only work authorization while keeping deferred action). The rescission was set aside on procedural grounds — the Court didn't rule on whether DACA itself is lawful.",
    currentStatus:
      "This ruling kept DACA alive procedurally in 2020, but didn't resolve DACA's underlying legality — that question is what Texas v. United States (above) is about. The two rulings answer different questions and shouldn't be conflated.",
    sourceTitle: "Justia: Department of Homeland Security v. Regents of the University of California, 591 U.S. 1 (2020)",
    sourceUrl: "https://supreme.justia.com/cases/federal/us/591/18-587/",
    relatedPolicyMemoId: "i821d-daca-current-status",
  },
  {
    id: "east-bay-sanctuary-v-trump",
    caseName: "East Bay Sanctuary Covenant v. Trump",
    citationOrDocket: "No. 18-cv-06810-JST (N.D. Cal.)",
    court: "U.S. District Court for the Northern District of California",
    decidedDate: "2026-05-07",
    formTypes: ["I-589"],
    summary:
      "In long-running litigation over the Circumvention of Lawful Pathways asylum rule, the district court (Judge Tigar) first vacated the rule on July 25, 2023. The Ninth Circuit vacated that ruling and remanded in April 2025 to address intervening law and policy changes. On May 7, 2026, the district court reaffirmed its original conclusion and again vacated the rule nationwide as inconsistent with the asylum statute.",
    currentStatus:
      "As of this writing, the rule stands vacated nationwide unless a higher court issues a stay — agencies and immigration judges should not hold a border crossing during the rule's active window (May 2023–May 2025) against an asylum applicant's eligibility under it. Whether a specific pending case is actually being handled consistently with this ruling isn't something this app can confirm.",
    sourceTitle: "CourtListener: East Bay Sanctuary Covenant v. Trump",
    sourceUrl: "https://www.courtlistener.com/opinion/10376011/east-bay-sanctuary-covenant-v-donald-j-trump/",
    relatedPolicyMemoId: "circumvention-of-lawful-pathways-2023",
  },
  {
    id: "niz-chavez-v-garland-2021",
    caseName: "Niz-Chavez v. Garland",
    citationOrDocket: "No. 19-863, 593 U.S. 155 (2021)",
    court: "Supreme Court of the United States",
    decidedDate: "2021-04-29",
    formTypes: "*",
    summary:
      "The Supreme Court held that a Notice to Appear sufficient to trigger the \"stop-time rule\" (which cuts off the period of continuous presence relevant to certain forms of relief from removal) must be a single document containing all the information the statute requires — not a series of separate notices that collectively supply it. This builds on the Court's earlier Pereira v. Sessions decision.",
    currentStatus:
      "This is the current operative standard for what counts as a valid, stop-time-triggering Notice to Appear. It's specifically about the NTA's effect on continuous-presence calculations for relief eligibility, not about NTA issuance or removal-proceeding merits generally.",
    sourceTitle: "Supreme Court of the United States: Niz-Chavez v. Garland, 593 U.S. 155 (2021)",
    sourceUrl: "https://www.supremecourt.gov/opinions/20pdf/19-863_6jgm.pdf",
  },
  {
    id: "sessions-v-morales-santana-2017",
    caseName: "Sessions v. Morales-Santana",
    citationOrDocket: "No. 15-1191, 582 U.S. 47 (2017)",
    court: "Supreme Court of the United States",
    decidedDate: "2017-06-12",
    formTypes: ["N-600"],
    summary:
      "The Supreme Court held that the INA's gender-based distinction for transmitting citizenship to a child born abroad to unmarried parents — a much shorter U.S. physical-presence requirement for an unwed citizen mother than for an unwed citizen father — violated the Fifth Amendment's equal protection guarantee. Rather than extend the shorter period to fathers, the Court's remedy applied the (then-)longer period to both, pending Congress addressing the disparity directly.",
    currentStatus:
      "This ruling governs how physical-presence requirements are applied for acquisition-of-citizenship cases involving unmarried parents where one parent's citizenship is the basis for the claim. Whether and how it applies to a specific N-600 case's own facts is exactly the kind of individualized question this app can't assess — that's an attorney question.",
    sourceTitle: "Justia: Sessions v. Morales-Santana, 582 U.S. 47 (2017)",
    sourceUrl: "https://supreme.justia.com/cases/federal/us/582/15-1191/",
  },
  {
    id: "scialabba-v-cuellar-de-osorio-2014",
    caseName: "Scialabba v. Cuellar de Osorio",
    citationOrDocket: "No. 12-930, 573 U.S. 41 (2014)",
    court: "Supreme Court of the United States",
    decidedDate: "2014-06-09",
    formTypes: ["I-130"],
    summary:
      "The Child Status Protection Act (CSPA) lets certain derivative beneficiaries of a family petition keep their place in line if they turn 21 (\"age out\") while a petition is pending. The statute contains language that can be read two different, conflicting ways for one category of aged-out beneficiary. The Supreme Court held (5–4, no majority opinion) that this ambiguity meant USCIS's own narrower interpretation — limiting which aged-out beneficiaries can keep their original priority date — was a permissible reading the agency was entitled to adopt.",
    currentStatus:
      "This is the current operative standard: USCIS's narrower CSPA interpretation controls for the beneficiary category this case addressed. Whether a specific derivative beneficiary retains their original priority date after aging out depends closely on their exact category and petition history — a case-specific question for an attorney, not something this app's general explanation can resolve.",
    sourceTitle: "Justia: Scialabba v. Cuellar de Osorio, 573 U.S. 41 (2014)",
    sourceUrl: "https://supreme.justia.com/cases/federal/us/573/41/",
  },
  {
    id: "trump-v-hawaii-2018",
    caseName: "Trump v. Hawaii",
    citationOrDocket: "No. 17-965, 585 U.S. 667 (2018)",
    court: "Supreme Court of the United States",
    decidedDate: "2018-06-26",
    formTypes: "*",
    summary:
      "The Supreme Court upheld Presidential Proclamation 9645 — an entry restriction affecting nationals of several countries — against challenges that it exceeded the President's statutory authority under the INA and violated the Establishment Clause. The Court held the President has broad authority under INA §212(f) to suspend entry of noncitizens when he finds it detrimental to U.S. interests, and applied a deferential \"rational basis\" review to the Establishment Clause claim.",
    currentStatus:
      "This ruling is the leading precedent for how much deference a presidential proclamation restricting entry receives from the courts — relevant background whenever a new proclamation-based restriction (like the ones referenced in the high-risk-countries hold policy above) faces a legal challenge, though it doesn't decide the legality of any later, differently-worded proclamation on its own.",
    sourceTitle: "Justia: Trump v. Hawaii, 585 U.S. 667 (2018)",
    sourceUrl: "https://supreme.justia.com/cases/federal/us/585/17-965/",
    relatedPolicyMemoId: "pm-602-0194-high-risk-hold",
  },
];

export function findCourtRulingById(id: string): CourtRuling | undefined {
  return COURT_RULINGS.find((r) => r.id === id);
}
