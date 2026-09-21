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
// immigration-law casebook. Four of these are the same real rulings
// already referenced in prose inside POLICY_MEMOS entries (the DACA and
// Circumvention of Lawful Pathways litigation, and pm-602-0194's own
// mention of its June 2026 vacatur) -- promoted to their own permalinks
// here and cross-linked, rather than existing only as an unlinkable mention.
//
// Hand-maintained, not an automated pipeline, per Peter's own explicit
// scoping call -- same starting point as POLICY_MEMOS (3 entries) and
// NEWS_SOURCES both began as a small hand-edited list. If this should
// auto-update later, that's a follow-up round, not assumed here.
//
// Round 127 follow-up (same day) -- Peter supplied three more research
// leads (two pasted case summaries, one live news item on third-country
// removal). Same independent-verification discipline as the first pass:
// each was re-confirmed via live search against a primary source/docket
// before being added, not trusted as pasted. 10 entries total.

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
  {
    // Round 127 follow-up — Peter's research lead. This is the actual
    // ruling policy-memos.ts's own pm-602-0194-high-risk-hold entry already
    // describes in prose ("a Rhode Island court vacated them outright on
    // June 5, 2026") but had no permalink for until now.
    id: "dorcas-v-uscis-2026",
    caseName: "Dorcas International Institute of Rhode Island v. United States Citizenship and Immigration Services",
    citationOrDocket: "No. 1:26-cv-00132-JJM-PAS (D.R.I.)",
    court: "U.S. District Court for the District of Rhode Island",
    decidedDate: "2026-06-05",
    formTypes: "*",
    summary:
      "Chief Judge John J. McConnell Jr. vacated four related USCIS policies — including PM-602-0194's automatic hold on final decisions for pending benefit applications (naturalization, family- and employment-based petitions, adjustment of status, work permits, and asylum) from nationals of about 39 countries designated \"high-risk.\" The court held USCIS exceeded its statutory authority, failed to adequately explain the change in policy, and relied on pretextual national-security justifications — a straightforward Administrative Procedure Act violation, not a ruling on immigration policy merits.",
    currentStatus:
      "The government appealed to the First Circuit (No. 26-1703); a stay of the vacatur pending appeal was denied on July 15, 2026, so the vacatur remains in effect. The district court separately had to order the government to show compliance after finding the holds were still being applied six days after the original order. Relief has generally applied to certified classes/plaintiffs rather than automatically to every case nationwide, so this app can't confirm from the status API alone whether a specific case has actually resumed normal processing.",
    sourceTitle: "USCIS: Court Order on Hold Policies",
    sourceUrl: "https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies",
    relatedPolicyMemoId: "pm-602-0194-high-risk-hold",
  },
  {
    // Round 127 follow-up — Peter's research lead. A separate policy from
    // pm-602-0194 above: this one is the State Department's own consular
    // immigrant-visa-issuance suspension, not a USCIS domestic-adjudication
    // hold, so it gets its own entry rather than sharing relatedPolicyMemoId
    // with the USCIS hold policy above -- conflating the two would misstate
    // which agency's policy this ruling actually addressed.
    id: "clinic-v-rubio-2026",
    caseName: "Catholic Legal Immigration Network, Inc. v. Rubio",
    citationOrDocket: "No. 1:26-cv-00858 (S.D.N.Y.)",
    court: "U.S. District Court for the Southern District of New York",
    decidedDate: "2026-08-21",
    formTypes: ["I-130", "I-140"],
    summary:
      "Effective January 21, 2026, the State Department paused issuing immigrant visas — the visa issued abroad after an underlying petition like Form I-130 or I-140 is approved and the case reaches the National Visa Center — to nationals of 75 countries, citing concern that immigrants from those countries were at high risk of relying on U.S. public benefits. Judge Jeannette A. Vargas held the blanket, nationality-wide suspension exceeded the State Department's statutory authority and violated the Immigration and Nationality Act's bar on nationality-based discrimination in immigrant-visa issuance, since it overrode the case-by-case discretion the statute assigns to individual consular officers.",
    currentStatus:
      "The court ordered the government to submit a sworn compliance status report; the government acknowledged more than 43,000 immigrant-visa applications had been denied solely under the vacated policy. The State Department confirmed as of late August 2026 that the pause is no longer in effect, though this app can't confirm whether a specific pending case's consular processing has actually resumed as a result.",
    sourceTitle: "U.S. Department of State: Immigrant Visa Processing Updates for Nationalities at High Risk of U.S. Public Benefits Reliance (Aug 28, 2026)",
    sourceUrl:
      "https://travel.state.gov/content/travel/en/News/visas-news/immigrant-visa-processing-updates-for-nationalities-at-high-risk-of-public-benefits-usage.html",
  },
  {
    // Round 127 follow-up — Peter's third research lead (a live news item,
    // decided within days of this round). No existing POLICY_MEMOS entry
    // covers third-country removal, so this stands with no relatedPolicyMemoId.
    id: "dvd-v-dhs-2026",
    caseName: "D.V.D. v. Department of Homeland Security",
    citationOrDocket: "No. 26-1212 (1st Cir.)",
    court: "U.S. Court of Appeals for the First Circuit",
    decidedDate: "2026-09-18",
    formTypes: ["I-589"],
    summary:
      "DHS policies issued in March and July 2025 let the agency remove a noncitizen with a final removal order to a \"third country\" — one neither named in their removal order nor previously disclosed to them in writing — without adequate notice or a meaningful chance to raise a fear of persecution or torture there first. On February 25, 2026, the district court (Judge Brian Murphy, D. Mass.) set the policy aside as unlawful. The First Circuit's ruling largely upheld that decision, holding that noncitizens must get a genuinely \"meaningful\" opportunity to raise safety concerns before removal to a country outside their original case, and questioning the government's reliance on unverified \"blanket assurances\" from receiving countries.",
    currentStatus:
      "The government is expected to seek further review (rehearing en banc or the Supreme Court); no such review has been decided as of this writing, so whether these protections hold or narrow further remains open. This ruling is about the notice and process due before a third-country removal, not the merits of any individual's underlying asylum or Convention Against Torture claim — whether it affects a specific pending case depends closely on that case's own removal history, an attorney question this app can't resolve.",
    sourceTitle: "Justia: D.V.D. v. Department of Homeland Security, No. 26-1212 (1st Cir. 2026)",
    sourceUrl: "https://law.justia.com/cases/federal/appellate-courts/ca1/26-1212/26-1212-2026-09-18.html",
  },
];

export function findCourtRulingById(id: string): CourtRuling | undefined {
  return COURT_RULINGS.find((r) => r.id === id);
}
