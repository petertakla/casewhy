// Round 85 — decides what happens to one candidate thread: draft a reply,
// escalate to Peter with no draft, or skip as not relevant. Implements
// SOCIAL_MEDIA_GUARDRAILS.md Sections 1 and 3.
//
// Same redundant-guardrail shape as src/lib/get-help/route-query.ts's
// COURT_REMOVAL_KEYWORDS: the two most safety-critical escalation triggers
// (a self-harm/crisis signal, and the EO 14161 social-media-vetting topic
// the guardrails doc singles out by name) are checked with a deterministic
// keyword pass FIRST, before the model ever sees the thread — this
// shouldn't depend on model judgment being reliable every single time.
// Everything else (relevance, which CaseWhy resource applies, hostile/
// bad-faith tone, a legal-advice request) is model-judged, since those
// genuinely need real language understanding, not a keyword list.

import { generateText } from "ai";

export type ClassifyOutcome =
  | { kind: "relevant"; resourceType: "processing_times" | "policy" | "get_help" | "app_usage"; reason: string }
  | { kind: "escalate"; reason: string }
  | { kind: "skip"; reason: string };

const CRISIS_KEYWORDS = [/suicidal/i, /kill myself/i, /end my life/i, /self[- ]harm/i, /want to die/i];

const EO_14161_KEYWORDS = [/\b14161\b/i, /social media vetting/i, /social-media vetting/i, /visa vetting/i];

const SYSTEM_INSTRUCTIONS = `You're screening one public forum thread for CaseWhy, a USCIS case-status tracking app (never a law firm, never affiliated with USCIS/DHS). CaseWhy has four kinds of real, factual data it can ground a reply in:
- processing_times: curated USCIS processing-time figures for specific form/category combinations
- policy: a small curated set of major USCIS policy/case-law changes and what they mean
- get_help: a directory of attorneys, accredited representatives, legal aid orgs, DSOs, and pro bono court representation
- app_usage: real facts about how the CaseWhy app itself works (e.g. "can it track multiple cases," "does it support notifications") -- only when the thread is genuinely asking about CaseWhy's own features, not a general USCIS process question

A thread is only "relevant" if it's a genuine question one of those four could actually help answer well — a processing-time question, "what does this status/policy mean," "where do I find [legal help / an attorney / a DSO]," or a real question about what CaseWhy itself can do. A thread that merely mentions USCIS without asking something CaseWhy's real data can answer is NOT relevant.

Separately flag (regardless of relevance):
- HOSTILE: the poster or thread is hostile, accusatory, or reads as bad-faith (e.g. a competitor or troll)
- LEGAL_ADVICE: the poster is specifically asking for advice on what THEY should do in their own case, not a general "how does this process work" question
- MOD_PUSHBACK: the thread already shows moderator warnings or self-promo pushback visible in the text

Respond in exactly this format, each label on its own line:
RELEVANT: yes or no
RESOURCE: processing_times, policy, get_help, app_usage, or none
HOSTILE: yes or no
LEGAL_ADVICE: yes or no
MOD_PUSHBACK: yes or no
REASON: one sentence explaining the RELEVANT call`;

function checkDeterministicEscalation(title: string, bodyText: string): string | null {
  const text = `${title}\n${bodyText}`;
  if (CRISIS_KEYWORDS.some((re) => re.test(text))) {
    return "Thread contains language suggesting a possible mental-health crisis or self-harm signal — flagged for Peter directly, per SOCIAL_MEDIA_GUARDRAILS.md Section 3, rather than drafting a reply.";
  }
  if (EO_14161_KEYWORDS.some((re) => re.test(text))) {
    return "Thread references the EO 14161 social-media-vetting rule — flagged for Peter's own calibrated answer, per SOCIAL_MEDIA_GUARDRAILS.md Section 3, rather than a templated draft.";
  }
  return null;
}

export async function classifyThread(params: {
  title: string;
  bodyText: string;
  isFirstPostInCommunity: boolean;
}): Promise<ClassifyOutcome> {
  const deterministic = checkDeterministicEscalation(params.title, params.bodyText);
  if (deterministic) return { kind: "escalate", reason: deterministic };

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    messages: [{ role: "user", content: `Title: ${params.title}\n\n${params.bodyText}` }],
  });

  const get = (label: string) => text.match(new RegExp(`${label}:\\s*(.*)`, "i"))?.[1]?.trim() ?? "";
  const relevant = /^yes/i.test(get("RELEVANT"));
  const resource = get("RESOURCE").toLowerCase();
  const hostile = /^yes/i.test(get("HOSTILE"));
  const legalAdvice = /^yes/i.test(get("LEGAL_ADVICE"));
  const modPushback = /^yes/i.test(get("MOD_PUSHBACK"));
  const reason = get("REASON") || "No reason returned.";

  if (hostile) return { kind: "escalate", reason: "Classifier flagged this thread as hostile or bad-faith — flagged for Peter rather than drafting a normal reply." };
  if (legalAdvice) return { kind: "escalate", reason: "Classifier flagged this as a request for advice on the poster's own specific case, which crosses into legal advice — flagged for Peter rather than drafting a reply." };
  if (modPushback) return { kind: "escalate", reason: "Classifier detected existing moderator pushback or self-promo warnings visible in the thread — flagged for Peter to judge rather than drafting into a thread already under scrutiny." };
  if (params.isFirstPostInCommunity) return { kind: "escalate", reason: "This would be the first CaseWhy reply drafted for this community — flagged for Peter's extra care per SOCIAL_MEDIA_GUARDRAILS.md Section 3, rather than auto-drafting into a community with no track record yet." };

  if (!relevant || (resource !== "processing_times" && resource !== "policy" && resource !== "get_help" && resource !== "app_usage")) {
    return { kind: "skip", reason: reason || "Not judged relevant to CaseWhy's real data." };
  }

  return { kind: "relevant", resourceType: resource, reason };
}
