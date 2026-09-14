// Round 73 (real) — generalizes round 85's community-only draftCommunityReply
// into the multi-channel marketing_queue. Two real upgrades over round 85's
// version, both explicitly requested by this round's task doc:
//
// 1. The "answer before a pitch" guardrail (SOCIAL_MEDIA_GUARDRAILS.md
//    Section 2) was previously just a prompt instruction hoping the model
//    complies. This version actually runs the test: when the draft
//    mentions CaseWhy, a second generation produces the same answer with
//    no CaseWhy mention at all. If that no-mention version is still a
//    substantial, complete answer (checked mechanically via length ratio,
//    not just trusted), the CaseWhy mention was decoration and the
//    original draft (with the mention) is kept. If the no-mention version
//    is markedly weaker/shorter -- the tell that the model was leaning on
//    the mention to justify an otherwise-thin answer -- the mention gets
//    dropped and the no-mention version becomes the real draft, per the
//    guardrail's own "rewritten or dropped" instruction.
// 2. links_enabled gating (default false, per the task doc -- round 79
//    flips it after the After Production gate): when off, the system
//    prompt forbids including any URL at all, even to CaseWhy's own site.

import { generateText } from "ai";
import { PROCESSING_TIMES, PROCESSING_TIMES_AS_OF } from "../kb/processing-times";
import { POLICY_MEMOS } from "../kb/policy-memos";
import { ENTITY_TYPES } from "../get-help/entity-types";

export type MarketingResourceType = "processing_times" | "policy" | "get_help";

export interface MarketingDraftResult {
  draftText: string;
  sourceCitation: string;
  mentionDropped: boolean;
}

function groundingContextFor(resourceType: MarketingResourceType): { context: string; citationHint: string } {
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

function baseInstructions(context: string, linksEnabled: boolean): string {
  return `You're drafting a proposed reply for Peter, CaseWhy's founder, to review before it goes anywhere -- nothing you write is ever posted automatically. CaseWhy is a free USCIS case-status tracking app Peter built; it is never a law firm and never gives legal advice.

Hard rules, no exceptions:
- Never give guidance specific to the poster's own case ("you should do X next"). Only general process/timeline/resource information.
- Never state a fact, statistic, or policy claim that isn't in the real CaseWhy data provided below. If the data doesn't fully answer the question, say so honestly rather than filling the gap.
- Never claim a CaseWhy feature exists unless it's a real, live feature.
- Never read as legal advice, an official USCIS position, or a guaranteed outcome or timeline.
- ${linksEnabled ? "If you mention CaseWhy, include a plain, upfront disclosure that Peter built it." : "Do not include any URL or link at all, to CaseWhy or anywhere else -- links are disabled for this draft."}
- Do not write filler or a generic non-answer. If the real data below genuinely can't answer this specific question well, say plainly that you can't draft a good reply (start your reply with "CANNOT_DRAFT:" followed by why).
- Match the tone of a real person answering a question, not marketing copy.

${context}

Respond with only the reply text itself (or the CANNOT_DRAFT line), nothing else.`;
}

async function generateOnce(params: { title: string; bodyText: string; instructions: string }): Promise<string> {
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: params.instructions,
    messages: [{ role: "user", content: `Thread/post title: ${params.title}\n\n${params.bodyText}` }],
  });
  return text.trim();
}

const CASEWHY_MENTION_RE = /casewhy/i;

export async function draftMarketingReply(params: {
  title: string;
  bodyText: string;
  resourceType: MarketingResourceType;
  linksEnabled: boolean;
}): Promise<MarketingDraftResult | null> {
  const { context, citationHint } = groundingContextFor(params.resourceType);
  const instructions = baseInstructions(context, params.linksEnabled);

  const draft = await generateOnce({ title: params.title, bodyText: params.bodyText, instructions });
  if (draft.startsWith("CANNOT_DRAFT:")) return null;

  if (!CASEWHY_MENTION_RE.test(draft)) {
    return { draftText: draft, sourceCitation: citationHint, mentionDropped: false };
  }

  // Real "answer before a pitch" test (SOCIAL_MEDIA_GUARDRAILS.md Section
  // 2), not just a prompt instruction: generate the same answer again with
  // CaseWhy explicitly excluded, and mechanically compare substance.
  const noMentionInstructions = `${instructions}\n\nAdditional constraint for this specific generation: do not mention CaseWhy, or any product/tool, at all. Answer using only the real data above.`;
  const noMentionDraft = await generateOnce({ title: params.title, bodyText: params.bodyText, instructions: noMentionInstructions });

  if (noMentionDraft.startsWith("CANNOT_DRAFT:")) {
    // The model can't answer at all without leaning on the CaseWhy
    // mention -- the mention was load-bearing. Per the guardrail's own
    // "rewritten or dropped" instruction, don't ship a pitch wearing an
    // answer's clothes; there's no substantive drop-in reply left to send.
    return null;
  }

  // Length-ratio check: if the no-mention answer holds up as a
  // substantial, complete reply on its own (not a thin stub), the CaseWhy
  // mention was decoration, not the actual substance -- keep the original.
  // If it's markedly weaker, the mention was propping up a thin answer --
  // drop the mention and ship the no-mention version instead.
  const standsAlone = noMentionDraft.length >= draft.length * 0.6;

  if (standsAlone) {
    return { draftText: draft, sourceCitation: citationHint, mentionDropped: false };
  }
  return { draftText: noMentionDraft, sourceCitation: citationHint, mentionDropped: true };
}
