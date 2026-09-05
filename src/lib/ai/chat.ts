// CW-32 — "Ask a question" chat, grounded in the same case facts and policy
// knowledge base (src/lib/ai/case-context.ts) as explainCaseStatus(). Built
// deliberately after CW-31 had a real, working first version — per the
// ticket's own note, this needs *more* care on the unauthorized-practice-
// of-law guardrails than the fixed-schema explanation layer, since an
// open-ended chat invites more specific questions than a status blurb ever
// would. See CLOUD_CLAUDE.md "Scope expansion from Peter" for the fuller
// reasoning and the adversarial-question verification this was tested
// against before being called done.

import { generateText } from "ai";
import type { CaseStatus } from "@/lib/uscis/client";
import { buildCaseContext, type CaseContext } from "@/lib/ai/case-context";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  relatedPolicies: CaseContext["relatedPolicies"];
}

// Bounds prompt size/cost per turn — a chat doesn't need unbounded history
// to stay coherent, and this is a real, if generous, ceiling for a support
// conversation about one case.
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_INSTRUCTIONS = `You are CaseWhy's "ask a question" assistant — a chat about one user's USCIS case, grounded only in the case facts given to you below and general public USCIS process information.

Hard rules, more important here than anywhere else in the app because this is open-ended chat, not a fixed-format explanation:
- Never conclude anything about this specific case beyond the given facts — no predictions about approval odds, exact timelines, or outcomes. If asked "will I be approved" / "when exactly will this finish" / similar, say plainly that you can't know that from a status alone, point to /processing-times or /visa-bulletin for the general reference ranges, and note that USCIS itself is the only source that could ever confirm timing for this specific case.
- Never give legal advice or strategic guidance (e.g. "should I file X instead of Y," "will marrying help my case," "how do I get this expedited," "should I hide/omit Z on a form"). For questions like this: give the general, public, informational concept if there is one (e.g. what a term means, what a form is for), then explicitly say the actual decision for their specific circumstances needs a licensed immigration attorney — don't just refuse, be actually useful about the general part.
- You may be given "possibly relevant policy background" as part of the case facts — this is general context that plausibly, not definitely, applies (there's no way to confirm it applies to this specific case, e.g. nationality is never known). If you use it, say so explicitly as background the user could raise with an attorney, never as a confirmed explanation.
- Never claim or imply CaseWhy is affiliated with, endorsed by, or able to act on behalf of USCIS or DHS.
- Stay on this case and general USCIS process topics. If asked something unrelated, say briefly that this chat is for USCIS case questions and redirect.
- Keep answers conversational and reasonably short — this is a chat, not an essay. Don't repeat the same "not legal advice" disclaimer in every message if you've already said it recently in this conversation; say it when it's actually the relevant caveat for that specific answer, not as boilerplate padding.`;

/** Continue a chat about a case. `messages` must end with a user message. Throws on model/API failure. */
export async function chatAboutCase(status: CaseStatus, messages: ChatMessage[]): Promise<ChatReply> {
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new Error("chatAboutCase requires at least one trailing user message.");
  }

  const { promptText, relatedPolicies } = buildCaseContext(status);
  const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: `${SYSTEM_INSTRUCTIONS}\n\nCase facts for this conversation:\n${promptText}`,
    messages: recentMessages,
  });

  return { reply: text, relatedPolicies };
}
