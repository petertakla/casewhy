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
// time at the current status, and the receipt number's processing center,
// all added the same day before concluding a knowledge base was needed at
// all. `relatedPolicies` is computed deterministically (not by the model)
// so citations shown to the user are guaranteed accurate, never
// hallucinated. No "only call on a status change" gating yet either: that
// needs the persistent case tracking from priority #2, so for now this
// runs on every lookup.

import { generateText, Output } from "ai";
import { z } from "zod";
import type { CaseStatus } from "@/lib/uscis/client";
import { findRelevantPolicyContext, type PolicyMemo } from "@/lib/kb/policy-memos";

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
  /** Deterministically matched, not model-generated — see file header. */
  relatedPolicies: Pick<PolicyMemo, "id" | "title" | "sourceTitle" | "sourceUrl">[];
}

// Service center inferred from the receipt number's 3-letter prefix. This is
// USCIS's own long-published convention (see USCIS's "how to read your
// receipt number" guidance), not something CaseWhy is inferring — only
// prefixes confirmed against that guidance are listed. An unrecognized
// prefix (including "IOE", which spans multiple physical centers) is simply
// omitted from the prompt rather than guessed.
const SERVICE_CENTERS: Record<string, string> = {
  EAC: "Vermont Service Center",
  WAC: "California Service Center",
  LIN: "Nebraska Service Center",
  SRC: "Texas Service Center",
  MSC: "National Benefits Center",
  NBC: "National Benefits Center",
  YSC: "Potomac Service Center",
};

function serviceCenter(receiptNumber: string): string | undefined {
  return SERVICE_CENTERS[receiptNumber.slice(0, 3).toUpperCase()];
}

/** Whole days between two parseable date strings, or null if either fails to parse. */
function daysBetween(earlier: string, later: string): number | null {
  const a = new Date(earlier).getTime();
  const b = new Date(later).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const SYSTEM_INSTRUCTIONS = `You explain USCIS case status updates in plain language for CaseWhy, a case-tracking tool.

Rules:
- Stay general and informational, grounded only in the case facts you're given (status text, description, history, dates, form type, processing center). Never conclude anything about this specific person's case beyond what those facts say — no predictions about outcomes, timelines, or approval odds.
- Never give legal advice. If next steps could depend on individual circumstances, say so and suggest consulting a licensed immigration attorney.
- Use the specific facts you're given — dates, elapsed time, what changed since the last status, the processing center — to make the explanation concrete to *this* case. Don't write an explanation that would read identically for any case with the same status text if you were given richer facts to work with.
- Don't pad next steps with generic filler ("keep your notice safe," "consult an attorney if unsure") unless the given facts actually point to it. Prefer 1-2 specific, well-earned next steps over a longer generic list.
- You may be given "possibly relevant policy background." This is general context that plausibly, not definitely, applies — USCIS's own status text never confirms why a case is delayed, and CaseWhy has no way to confirm this policy applies to this specific case (e.g. it never knows the applicant's nationality). If you use it, frame it explicitly as background the user could ask an attorney about ("this may or may not be related to your case, but...") — never state or imply it explains this case's status as fact.
- Write for someone unfamiliar with USCIS jargon. Avoid restating the status text verbatim — add clarity, not repetition.`;

/** Explain a case status in plain language. Throws on model/API failure — callers should catch and degrade gracefully. */
export async function explainCaseStatus(status: CaseStatus): Promise<CaseExplanation> {
  const center = serviceCenter(status.receiptNumber);
  const today = new Date().toISOString().slice(0, 10);
  const daysAtCurrentStatus = status.modifiedDate ? daysBetween(status.modifiedDate, today) : null;
  const daysSinceFiling = status.submittedDate ? daysBetween(status.submittedDate, today) : null;

  const historyText = status.history.map((h) => h.completed_text_en).join(" ");
  const relatedPolicies = findRelevantPolicyContext({
    formType: status.formType,
    statusText: status.statusText,
    statusDescription: status.statusDescription,
    historyText,
    submittedDate: status.submittedDate,
  });

  const promptLines = [
    `Form type: ${status.formType}`,
    center && `Processing center: ${center}`,
    status.submittedDate && `Filed: ${status.submittedDate}${daysSinceFiling !== null ? ` (${daysSinceFiling} days ago)` : ""}`,
    `Current status: ${status.statusText}`,
    `Description: ${status.statusDescription}`,
    status.modifiedDate &&
      `Status last updated: ${status.modifiedDate}${daysAtCurrentStatus !== null ? ` (${daysAtCurrentStatus} days ago)` : ""}`,
    status.history.length > 0 &&
      `Full status history for this case, each entry dated (order as returned by USCIS, not guaranteed chronological — read the dates):\n${status.history
        .map((h) => `- ${h.date}: ${h.completed_text_en}`)
        .join("\n")}`,
    relatedPolicies.length > 0 &&
      `Possibly relevant policy background (see system instructions on how to use this):\n${relatedPolicies
        .map((p) => `- ${p.title}: ${p.summary} Current status: ${p.currentStatus}`)
        .join("\n")}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const { output } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    output: Output.object({ schema: explanationSchema }),
    prompt: promptLines,
  });

  return {
    ...output,
    relatedPolicies: relatedPolicies.map(({ id, title, sourceTitle, sourceUrl }) => ({
      id,
      title,
      sourceTitle,
      sourceUrl,
    })),
  };
}
