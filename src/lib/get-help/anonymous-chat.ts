// Round 60 Phase B — the zero-friction anonymous "ask CaseWhy" surface. No
// sign-in, no tracked case, no receipt number — grounded in CaseWhy's
// policy knowledge base (src/lib/kb/policy-memos.ts) rather than any
// specific person's case, since there's no case to ground it in for an
// anonymous visitor. Deliberately scoped to general process/policy
// questions; a case-specific question gets redirected to sign-in +
// track-a-case (the honest answer, not a guess) rather than answered.
//
// Same hard-guardrail discipline as src/lib/ai/chat.ts and
// src/lib/get-help/route-query.ts, carried over in full and arguably more
// important here — this surface is fully anonymous, more exposed to
// someone trying to extract real legal advice with no accountability
// trail. The court/removal/detention guardrail is enforced the same way
// route-query.ts does it: a deterministic keyword check runs first and, on
// a match, skips the model and returns a fixed redirect — never left to
// depend on model behavior alone.

import { generateText } from "ai";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";

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

export const COURT_REMOVAL_REDIRECT =
  "This sounds like it involves immigration court or removal (deportation) proceedings — that genuinely needs a licensed human, not an AI chat. Please see Attorneys or Pro bono immigration-court representation on the Get Help page.";

export const CASE_SPECIFIC_REDIRECT =
  "I can't answer what's happening with your specific case from here — I don't have access to it. Sign in and track your case (free) to ask about it directly, grounded in your case's real status.";

const MAX_HISTORY_MESSAGES = 10;

export interface AnonymousChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLICY_REFERENCE = POLICY_MEMOS.map((p) => `- ${p.title}: ${p.summary}`).join("\n");

const SYSTEM_INSTRUCTIONS = `You are CaseWhy's free, anonymous "ask a general question" assistant. The visitor is NOT signed in and has NOT shared any specific case — you have no receipt number, no case status, nothing case-specific about them. Answer general USCIS process/policy questions only (what a status or term means, how a process generally works, what happens at a given stage) using general public USCIS knowledge and, where relevant, this reference background:

${POLICY_REFERENCE}

Hard rules:
- Never answer anything that requires knowing a specific person's actual case facts (their real status, their real timeline, whether "my case" will be approved). If asked something case-specific, say plainly you can't know that without their actual case, and suggest they sign in and track their case for free to ask about it directly — don't guess or improvise a plausible-sounding answer.
- Never predict approval odds, exact timelines, or outcomes for anyone's situation, general or specific.
- Never give legal advice or strategic guidance. For a question like this, give the general public informational concept if there is one, then say plainly that their specific situation needs a licensed immigration attorney.
- Never claim or imply CaseWhy is affiliated with, endorsed by, or able to act on behalf of USCIS or DHS.
- Stay on general USCIS process/policy topics. If asked something unrelated, say briefly that this is for general USCIS process questions and redirect.
- Keep answers conversational and reasonably short.`;

/** Deterministic court/removal check — runs before the model, same discipline as route-query.ts's hard-route. Never depends on the model alone to catch this. */
export function needsHumanRedirect(text: string): boolean {
  return COURT_REMOVAL_KEYWORDS.some((re) => re.test(text));
}

export async function askAnonymousQuestion(messages: AnonymousChatMessage[]): Promise<string> {
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new Error("askAnonymousQuestion requires at least one trailing user message.");
  }

  const lastMessage = messages[messages.length - 1].content;
  if (needsHumanRedirect(lastMessage)) {
    return COURT_REMOVAL_REDIRECT;
  }

  const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    messages: recentMessages,
  });

  return text;
}
