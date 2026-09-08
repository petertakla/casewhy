// Round 24 — always-on term links in AI explanation prose, separate from
// linkifyExplanation's narrowly-scoped KB-match linking (round 20): those
// only fire when a case's own matched policies happen to include the term
// as a keyword. These fire whenever the term appears, regardless of KB
// matching. Hand-curated, same "not scraped" pattern as RESOURCE_LINKS.
//
// New task, same day as round 29/30 — "attorney" added so the model's own
// guardrail-driven redirects ("consult a licensed immigration attorney,"
// "redirect to an attorney") become a real link to /get-help instead of
// inert text, wherever the phrase appears in AI-generated prose (dashboard
// explanations and chat replies alike — see linkifyExplanation call sites).

export interface TermLink {
  term: string;
  url: string;
  /** Internal CaseWhy page — rendered without target="_blank". */
  internal?: boolean;
}

export const TERM_LINKS: TermLink[] = [
  { term: "Visa Bulletin", url: "/visa-bulletin", internal: true },
  { term: "N-400", url: "https://www.uscis.gov/n-400" },
  { term: "I-485", url: "https://www.uscis.gov/i-485" },
  { term: "attorney", url: "/get-help", internal: true },
];
