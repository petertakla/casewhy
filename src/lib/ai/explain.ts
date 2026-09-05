// Plain-language explanation layer — CaseWhy's actual product wedge.
//
// Turns a raw USCIS case status into a plain-language explanation and
// general next-step guidance, via a Claude model through the Vercel AI
// Gateway (model id fetched from https://ai-gateway.vercel.sh/v1/models —
// confirm it's still current before bumping).
//
// Using Haiku 4.5 rather than Sonnet 5: Sonnet 5 requires a paid AI Gateway
// tier ("free tier users do not have access to this model"); Haiku fits the
// free $5/month credit. This task (short status text -> plain-language
// summary against a fixed schema) is squarely in Haiku's range, so this is
// a considered choice, not just a cost workaround — see memory
// (feedback_ai_model_choice) for the fuller reasoning and the upgrade path.
//
// CW-31 (Sep 5, 2026): now also grounds the explanation in a small curated
// policy knowledge base (src/lib/kb/policy-memos.ts) when a case's own facts
// plausibly match an entry — on top of the full status history, elapsed
// time at the current status, and the receipt number's processing center.
// The actual fact-gathering (buildCaseContext) is shared with the CW-32
// chat in src/lib/ai/case-context.ts — extracted there once both needed the
// identical set of facts. `relatedPolicies` is computed deterministically
// (not by the model) so citations shown to the user are guaranteed
// accurate, never hallucinated. No "only call on a status change" gating
// yet either: that needs the persistent case tracking from priority #2, so
// for now this runs on every lookup.

import { generateText, Output } from "ai";
import { z } from "zod";
import type { CaseStatus } from "@/lib/uscis/client";
import { buildCaseContext, type CaseContext } from "@/lib/ai/case-context";

const explanationSchema = z.object({
  explanation: z
    .string()
    .describe("A plain-language explanation of what this status means, 2-4 sentences."),
  nextSteps: z
    .array(z.string())
    .describe("General, informational next-step guidance — 1-4 short items."),
});

export interface CaseExplanation {
  explanation: string;
  nextSteps: string[];
  relatedPolicies: CaseContext["relatedPolicies"];
}

const SYSTEM_INSTRUCTIONS = `You explain USCIS case status updates in plain language for CaseWhy, a case-tracking tool.

Rules:
- Stay general and informational, grounded only in the case facts you're given (status text, description, history, dates, form type, processing center). Never conclude anything about this specific person's case beyond what those facts say — no predictions about outcomes, timelines, or approval odds.
- Never give legal advice. If next steps could depend on individual circumstances, say so and suggest consulting a licensed immigration attorney.
- Use the specific facts you're given — dates, elapsed time, what changed since the last status, the processing center — to make the explanation concrete to *this* case. Don't write an explanation that would read identically for any case with the same status text if you were given richer facts to work with.
- Don't pad next steps with generic filler ("keep your notice safe," "consult an attorney if unsure") unless the given facts actually point to it. Prefer 1-2 specific, well-earned next steps over a longer generic list.
- You may be given "possibly relevant policy background" — see the note attached to it in the prompt for how to use it.
- Write for someone unfamiliar with USCIS jargon. Avoid restating the status text verbatim — add clarity, not repetition.`;

/** Explain a case status in plain language. Throws on model/API failure — callers should catch and degrade gracefully. */
export async function explainCaseStatus(status: CaseStatus): Promise<CaseExplanation> {
  const { promptText, relatedPolicies } = buildCaseContext(status);

  const { output } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    output: Output.object({ schema: explanationSchema }),
    prompt: promptText,
  });

  return { ...output, relatedPolicies };
}
