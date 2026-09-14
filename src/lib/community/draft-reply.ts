// Round 85 — drafts a grounded community reply for a thread the classifier
// already judged relevant. Only ever called for resourceType in
// {processing_times, policy, get_help} — a thread judged "skip" or
// "escalate" never reaches this function.
//
// Implements SOCIAL_MEDIA_GUARDRAILS.md Section 1 (never case-specific
// guidance, never overclaim product state, never legal advice, never take
// a policy position) and Section 2 (disclosure, a named source, answer
// before pitch) as system instructions — same generateText/AI Gateway
// pattern as src/lib/email-aliases/draft-response.ts.

import { generateText } from "ai";
import { PROCESSING_TIMES, PROCESSING_TIMES_AS_OF } from "../kb/processing-times";
import { POLICY_MEMOS } from "../kb/policy-memos";
import { ENTITY_TYPES } from "../get-help/entity-types";

export interface DraftReplyResult {
  draftReply: string;
  sourceCitation: string;
}

function groundingContextFor(resourceType: "processing_times" | "policy" | "get_help"): {
  context: string;
  citationHint: string;
} {
  if (resourceType === "processing_times") {
    const rows = PROCESSING_TIMES.map(
      (e) => `- ${e.formType} (${e.categoryLabel}), ${e.office}: ${e.percentile80Months} months${e.note ? ` — ${e.note}` : ""}`
    ).join("\n");
    return {
      context: `Real CaseWhy processing-time data (as of ${PROCESSING_TIMES_AS_OF}, sourced from USCIS's own tool):\n${rows}`,
      citationHint: `Processing times, USCIS data as of ${PROCESSING_TIMES_AS_OF}`,
    };
  }
  if (resourceType === "policy") {
    const rows = POLICY_MEMOS.map((m) => `- ${m.title} (${m.datePublished}): ${m.summary}`).join("\n");
    return {
      context: `Real CaseWhy policy-library entries:\n${rows}`,
      citationHint: "CaseWhy policy library (/policy)",
    };
  }
  const rows = ENTITY_TYPES.filter((e) => e.status === "live")
    .map((e) => `- ${e.label} (${e.href}): ${e.description}`)
    .join("\n");
  return {
    context: `Real CaseWhy Get Help directory categories:\n${rows}`,
    citationHint: "CaseWhy Get Help directory (/get-help)",
  };
}

const SYSTEM_INSTRUCTIONS = `You're drafting a proposed community-forum reply for Peter, CaseWhy's founder, to review and post himself if he chooses -- nothing you write is ever posted automatically. CaseWhy is a free USCIS case-status tracking app Peter built; it is never a law firm and never gives legal advice.

Hard rules, no exceptions:
- Never give guidance specific to the poster's own case ("you should do X next"). Only general process/timeline/resource information.
- Never state a fact, statistic, or policy claim that isn't in the real CaseWhy data provided below. If the data doesn't fully answer the question, say so honestly rather than filling the gap.
- Never claim a CaseWhy feature exists unless it's a real, live feature (case tracking, status explanations, the Get Help directory, the processing-times/policy pages).
- Never read as legal advice, an official USCIS position, or a guaranteed outcome or timeline.
- Include a plain, upfront disclosure that Peter built CaseWhy -- do not bury it in a signature line.
- The reply must still make complete sense as a genuine, helpful answer if every CaseWhy mention were deleted from it. If the CaseWhy mention is load-bearing to the answer's usefulness, the answer isn't real enough yet -- write a more substantive answer first.
- Do not write filler or a generic non-answer. If the real data below genuinely can't answer this specific question well, say plainly that you can't draft a good reply (start your reply with "CANNOT_DRAFT:" followed by why).
- Match the tone of a real person answering a question in a forum, not marketing copy.

Respond with only the reply text itself (or the CANNOT_DRAFT line), nothing else.`;

export async function draftCommunityReply(params: {
  title: string;
  bodyText: string;
  resourceType: "processing_times" | "policy" | "get_help";
}): Promise<DraftReplyResult | null> {
  const { context, citationHint } = groundingContextFor(params.resourceType);

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: `${SYSTEM_INSTRUCTIONS}\n\n${context}`,
    messages: [{ role: "user", content: `Thread title: ${params.title}\n\n${params.bodyText}` }],
  });

  const trimmed = text.trim();
  if (trimmed.startsWith("CANNOT_DRAFT:")) return null;

  return { draftReply: trimmed, sourceCitation: citationHint };
}
