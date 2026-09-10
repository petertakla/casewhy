// Round 60 — AI-assisted routing for the Get Help chooser's "describe your
// situation" free-text box. Reuses the same AI Gateway call mechanism and
// guardrail discipline as src/lib/ai/chat.ts, but this is a narrow
// classification task, not a conversation: the model's only job is picking
// one or more outcomes from a fixed, allow-listed vocabulary. Its raw
// output is never trusted or rendered directly — always parsed and
// validated against the allow-list before use, with "not_sure" as the safe
// fallback for anything unrecognized.
//
// The hard guardrail (never recommend AI chat over a licensed human for
// court/removal-proceedings/representation-need situations) is enforced
// twice, deliberately redundant: a deterministic keyword check runs FIRST
// and, if it matches, skips the model entirely — this is the actual
// safety-critical part of the feature and shouldn't depend on model
// behavior being reliable every single time. The model's own system prompt
// carries the same rule as a second layer for cases the keyword list
// doesn't catch.

import { generateText } from "ai";
import { ENTITY_TYPES, type EntityTypeId } from "./entity-types";

export type RouteOutcomeId = EntityTypeId | "ask_ai" | "not_sure";

export interface RouteResult {
  outcomeIds: RouteOutcomeId[];
  /** True if the deterministic keyword guardrail fired, bypassing the model entirely. */
  hardRouted: boolean;
}

// Deliberately broad rather than clever — a false positive here just means
// a visitor sees Attorneys/pro bono representation alongside other
// options, which is never wrong to show; a false negative means the model
// alone has to get it right, which is the risk this list exists to reduce.
const COURT_REMOVAL_KEYWORDS = [
  /removal proceeding/i,
  /deportation/i,
  /immigration court/i,
  /notice to appear/i,
  /\bnta\b/i,
  /master calendar/i,
  /individual hearing/i,
  /immigration judge/i,
  /\beoir\b/i,
  /detained/i,
  /detention center/i,
  /bond hearing/i,
];

const HARD_ROUTE_OUTCOMES: RouteOutcomeId[] = ["attorneys", "pro_bono_representation"];

const VALID_OUTCOMES = new Set<RouteOutcomeId>([...ENTITY_TYPES.map((e) => e.id), "ask_ai", "not_sure"]);

const SYSTEM_INSTRUCTIONS = `You are a routing classifier for CaseWhy's "Get Help" page. A visitor describes their situation in their own words. Your ONLY job is to pick which real resource type(s) apply — you never answer their question, give advice, or write any explanation.

Output format: respond with ONLY a comma-separated list of these exact tokens, nothing else — no prose, no punctuation besides commas:
- attorneys — wants a licensed professional to formally represent them, sign filings, or appear in court
- accredited_representatives — wants legal help but can't afford a private attorney, or prefers a nonprofit
- legal_aid — needs general guidance/consultation, limited income
- pro_bono_representation — is currently in immigration court / removal (deportation) proceedings and needs representation there, at no cost
- dso — is an F-1/M-1 international student with a school/SEVIS status question
- community_orgs — wants local/cultural/linguistic community support, not necessarily legal help
- ask_ai — just wants a plain-language answer to a general understanding question (what does a status/term mean, how a process generally works) — NOT case-specific advice or an outcome prediction
- not_sure — the description doesn't clearly map to any of the above

HARD RULE, overrides everything else: if the situation plainly involves immigration court, removal/deportation proceedings, detention, or needing representation in a legal proceeding, you MUST include attorneys and pro_bono_representation in your answer and MUST NOT include ask_ai — never recommend an AI chat in place of a licensed human for something like this, even if the visitor also seems to want a plain-language explanation of something.

You may return more than one token (comma-separated) when genuinely more than one resource applies (e.g. "accredited_representatives,legal_aid"). Never write anything except tokens from the exact list above.`;

function parseOutcomes(raw: string): RouteOutcomeId[] {
  const tokens = raw
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const valid = tokens.filter((t): t is RouteOutcomeId => VALID_OUTCOMES.has(t as RouteOutcomeId));
  return valid.length > 0 ? [...new Set(valid)] : ["not_sure"];
}

export async function routeVisitorQuery(freeText: string): Promise<RouteResult> {
  const trimmed = freeText.trim().slice(0, 1000);
  if (!trimmed) {
    return { outcomeIds: ["not_sure"], hardRouted: false };
  }

  if (COURT_REMOVAL_KEYWORDS.some((re) => re.test(trimmed))) {
    return { outcomeIds: HARD_ROUTE_OUTCOMES, hardRouted: true };
  }

  try {
    const { text } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      instructions: SYSTEM_INSTRUCTIONS,
      messages: [{ role: "user", content: trimmed }],
    });
    return { outcomeIds: parseOutcomes(text), hardRouted: false };
  } catch {
    return { outcomeIds: ["not_sure"], hardRouted: false };
  }
}
