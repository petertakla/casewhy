import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "@/app/dashboard/actions";
import { getSubscriptionTier } from "@/lib/billing/tier";
import { getChatUsage, incrementChatUsage } from "@/lib/billing/chat-usage";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { chatAboutCase, type ChatMessage } from "@/lib/ai/chat";
import { resolveLinkedContent, isLinkResolutionError } from "@/lib/ai/link-context";
import { QUICK_ASK } from "@/lib/ai/quick-ask";

const MAX_MESSAGE_LENGTH = 4000;

// Round 127 — a guaranteed, code-appended disclaimer for the two quick-ask
// questions, not left to chat.ts's SYSTEM_INSTRUCTIONS alone. The system
// prompt is real guardrail work and stays in place, but a prompt is
// something a model *usually* follows, not something that's guaranteed —
// and this is exactly the fact pattern (a policy/court-ruling "does this
// apply to me" answer) that a real UPL-risk review flagged as needing more
// than "usually." Appending this deterministically, server-side, after the
// model's own reply, means the disclaimer is on every one of these answers
// regardless of what the model actually generated, the same "don't trust
// the model for anything that can be guaranteed instead" discipline this
// codebase already applies to citation matching (case-context.ts).
// Plain text, not markdown — CaseChat.tsx renders a reply as plain text
// (whitespace-pre-wrap + linkifyExplanation's term-linking only), it does
// not parse markdown syntax, so this reads literally as typed here.
const QUICK_ASK_DISCLAIMER =
  "\n\nThis is general information based on your case's own facts, not a legal determination — only USCIS or a licensed immigration attorney can confirm how this actually applies to your case.";

function isQuickAskMessage(content: string): boolean {
  return content === QUICK_ASK.applies.message || content === QUICK_ASK.explains.message;
}

function isValidMessages(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
    ) &&
    value[value.length - 1].role === "user"
  );
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { receiptNumber, messages, linkedUrl } = body as {
    receiptNumber?: unknown;
    messages?: unknown;
    linkedUrl?: unknown;
  };
  if (typeof receiptNumber !== "string" || !receiptNumber) {
    return NextResponse.json({ error: "receiptNumber is required." }, { status: 400 });
  }
  if (!isValidMessages(messages)) {
    return NextResponse.json(
      { error: "messages must be a non-empty array ending with a user message." },
      { status: 400 }
    );
  }

  // Round 63 — a pasted link is resolved server-side from the URL itself,
  // never trusted from any client-supplied "content" field. The client
  // only ever names which internal page it means.
  let linkedContent;
  if (typeof linkedUrl === "string" && linkedUrl.trim()) {
    const resolved = await resolveLinkedContent(linkedUrl);
    if (isLinkResolutionError(resolved)) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    linkedContent = resolved;
  }

  // Re-derived server-side from the authenticated session every time, not
  // trusted from the client — the client only ever names which of its own
  // tracked cases this conversation is about (CW-36: could be one of
  // several), never supplies case data itself.
  const trackedCasesList = await getTrackedCases(session.user.id);
  if (trackedCasesList.length === 0) {
    return NextResponse.json({ error: "Track a case on your dashboard first." }, { status: 400 });
  }
  if (!trackedCasesList.some((c) => c.receiptNumber === receiptNumber)) {
    return NextResponse.json({ error: "That case isn't one of your tracked cases." }, { status: 403 });
  }

  const tier = await getSubscriptionTier(session.user.id);
  const usage = await getChatUsage(session.user.id, tier);
  if (usage.limitReached) {
    return NextResponse.json(
      {
        error: "AI chat about your case is a CaseWhy Plus feature.",
        limitReached: true,
        usage,
      },
      { status: 402 }
    );
  }

  let status;
  try {
    status = await getCaseStatus(receiptNumber);
  } catch (err) {
    const message =
      err instanceof UscisApiError
        ? "Couldn't reach USCIS's case status service right now. Please try again shortly."
        : "Something went wrong looking up your case.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    const result = await chatAboutCase(status, messages, linkedContent);
    await incrementChatUsage(session.user.id);
    const updatedUsage = await getChatUsage(session.user.id, tier);
    const lastUserMessage = messages[messages.length - 1].content;
    const reply = isQuickAskMessage(lastUserMessage) ? `${result.reply}${QUICK_ASK_DISCLAIMER}` : result.reply;
    return NextResponse.json({ ...result, reply, usage: updatedUsage });
  } catch {
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
