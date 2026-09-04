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
// No curated policy/case-law knowledge base yet — ships on the raw status
// text alone. No "only call on a status change" gating yet either: that
// needs the persistent case tracking from priority #2, so for now this
// runs on every lookup.

import { generateText, Output } from "ai";
import { z } from "zod";
import type { CaseStatus } from "@/lib/uscis/client";

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
}

const SYSTEM_INSTRUCTIONS = `You explain USCIS case status updates in plain language for CaseWhy, a case-tracking tool.

Rules:
- Stay general and informational, grounded only in the status text and description given to you.
- Never conclude anything about this specific person's case beyond what the status text says — no predictions about outcomes, timelines, or approval odds.
- Never give legal advice. If next steps could depend on individual circumstances, say so and suggest consulting a licensed immigration attorney.
- Write for someone unfamiliar with USCIS jargon. Avoid restating the status text verbatim — add clarity, not repetition.`;

/** Explain a case status in plain language. Throws on model/API failure — callers should catch and degrade gracefully. */
export async function explainCaseStatus(status: CaseStatus): Promise<CaseExplanation> {
  const { output } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    output: Output.object({ schema: explanationSchema }),
    prompt: [
      `Form type: ${status.formType}`,
      `Status: ${status.statusText}`,
      `Description: ${status.statusDescription}`,
    ].join("\n"),
  });
  return output;
}
