// Round 59 — name+state fuzzy matching against EOIR's disciplined-
// practitioners list (src/lib/db/schema.ts's disciplinedPractitioners
// table). Deliberately hand-rolled Levenshtein rather than a new
// dependency — small, well-understood, and the whole point here is that
// the confidence score is inspectable, not a black box.
//
// Real name-matching is inherently fuzzy: common names, aliases,
// middle-name variations. This never returns a single yes/no — every
// match carries an explicit confidence tier so a caller can decide how
// much weight to give it, per the task's own explicit instruction not to
// treat a fuzzy match the same as an exact one.

export type MatchConfidence = "exact" | "high" | "medium" | "low";

export interface DisciplineRecord {
  name: string;
  normalizedName: string;
  cityState: string;
  states: string; // comma-separated 2-letter codes
  finalDisciplineImposed: string | null;
  effectiveDate: string | null;
  reinstated: boolean;
}

export interface DisciplineMatch {
  record: DisciplineRecord;
  confidence: MatchConfidence;
  nameSimilarity: number; // 0..1
  stateOverlap: boolean;
}

const NAME_SUFFIXES = /\b(jr|sr|ii|iii|iv|esq)\b\.?/g;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(NAME_SUFFIXES, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STATE_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "puerto rico": "PR", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  "district of columbia": "DC",
};
const VALID_ABBR = new Set(Object.values(STATE_ABBR));

/** Pulls every 2-letter state code out of free text — handles "City, ST",
 * "State1/State2", bare full state names, and a bare 2-letter code. */
export function extractStates(text: string): string[] {
  const found = new Set<string>();
  const upper = text.toUpperCase();
  for (const abbr of VALID_ABBR) {
    if (new RegExp(`\\b${abbr}\\b`).test(upper)) found.add(abbr);
  }
  const lower = text.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_ABBR)) {
    if (lower.includes(name)) found.add(abbr);
  }
  return [...found];
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr.push(Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost));
    }
    prev = curr;
  }
  return prev[n];
}

export function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Screens one candidate (name + free-text location/state field, which may
 * be empty) against the full disciplined-practitioners list. Returns every
 * match at "low" confidence or above, sorted by confidence/similarity —
 * empty array means no match, which is the expected, common case.
 */
export function findDisciplineMatches(
  candidateName: string,
  candidateStatesText: string,
  records: DisciplineRecord[]
): DisciplineMatch[] {
  const normalizedCandidate = normalizeName(candidateName);
  if (!normalizedCandidate) return [];
  const candidateStates = new Set(extractStates(candidateStatesText));

  const matches: DisciplineMatch[] = [];
  for (const record of records) {
    const similarity = nameSimilarity(normalizedCandidate, record.normalizedName);
    const recordStates = record.states ? record.states.split(",") : [];
    const stateOverlap = candidateStates.size === 0 ? false : recordStates.some((s) => candidateStates.has(s));

    let confidence: MatchConfidence | null = null;
    if (similarity === 1) {
      confidence = "exact";
    } else if (similarity >= 0.88 && stateOverlap) {
      confidence = "high";
    } else if (similarity >= 0.88 && !stateOverlap) {
      confidence = "medium";
    } else if (similarity >= 0.75 && stateOverlap) {
      confidence = "low";
    }

    if (confidence) {
      matches.push({ record, confidence, nameSimilarity: similarity, stateOverlap });
    }
  }

  const order: Record<MatchConfidence, number> = { exact: 0, high: 1, medium: 2, low: 3 };
  matches.sort((a, b) => order[a.confidence] - order[b.confidence] || b.nameSimilarity - a.nameSimilarity);
  return matches;
}

export function formatMatchSummary(matches: DisciplineMatch[]): string {
  return matches
    .map((m) => {
      const r = m.record;
      const discipline = r.finalDisciplineImposed || "(discipline type not recorded)";
      const effective = r.effectiveDate ? ` effective ${r.effectiveDate}` : "";
      const reinstated = r.reinstated ? " (reinstated)" : "";
      return `${m.confidence.toUpperCase()} confidence (${Math.round(m.nameSimilarity * 100)}% name match${m.stateOverlap ? ", same state" : ""}): ${r.name} [${r.cityState}] — ${discipline}${effective}${reinstated}`;
    })
    .join("\n");
}
