// Round 70 — drafts a proposed reply + summary + proposed action for one
// incoming alias message. Same generateText pattern as src/lib/ai/chat.ts
// (Vercel AI Gateway, no direct provider package). Everything this
// produces is a *proposal* only — src/app/admin/inbox holds it for a real
// approval click before anything sends or executes; this function never
// calls sendAsAlias itself.

import { generateText } from "ai";

export interface DraftResult {
  summary: string;
  draftReply: string;
  proposedAction: string | null;
}

const SYSTEM_INSTRUCTIONS = `You're drafting a proposed reply for one of CaseWhy's response-alias inboxes. CaseWhy is a USCIS case-status tracking app -- never a law firm, never able to confirm case outcomes, never affiliated with USCIS or DHS.

A human (CaseWhy's founder) reviews and can edit every draft before anything is ever sent -- so write a real, complete, honestly useful reply, not a maximally-hedged non-answer. But never state something as fact that you can't actually know from the email alone (case outcomes, legal conclusions, timelines specific to one person's case).

Respond in exactly this three-line format, each label starting a new line:
SUMMARY: one sentence describing what this email is about
REPLY: a complete proposed reply, written as CaseWhy would send it
ACTION: a short, concrete proposed next step for CaseWhy staff (e.g. "flag this status text for review", "log as a CCPA deletion request, due within 45 days"), or exactly "none" if the reply alone is sufficient`;

export async function draftAliasResponse(params: {
  alias: string;
  purpose: string;
  fromAddress: string;
  subject: string;
  bodyText: string;
}): Promise<DraftResult> {
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: `${SYSTEM_INSTRUCTIONS}\n\nThis inbox's purpose: ${params.alias}@casewhy.com — ${params.purpose}`,
    messages: [
      {
        role: "user",
        content: `From: ${params.fromAddress}\nSubject: ${params.subject}\n\n${params.bodyText}`,
      },
    ],
  });

  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=\n *REPLY:|$)/i);
  const replyMatch = text.match(/REPLY:\s*([\s\S]*?)(?=\n *ACTION:|$)/i);
  const actionMatch = text.match(/ACTION:\s*([\s\S]*)$/i);

  const proposedActionText = actionMatch?.[1]?.trim() ?? null;
  return {
    summary: summaryMatch?.[1]?.trim() || "Unable to summarize.",
    draftReply: replyMatch?.[1]?.trim() || text.trim(),
    proposedAction:
      proposedActionText && proposedActionText.toLowerCase() !== "none" ? proposedActionText : null,
  };
}
