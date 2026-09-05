import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "@/app/dashboard/actions";
import { getSubscriptionTier } from "@/lib/billing/tier";
import { getChatUsage, incrementChatUsage } from "@/lib/billing/chat-usage";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { chatAboutCase, type ChatMessage } from "@/lib/ai/chat";

const MAX_MESSAGE_LENGTH = 4000;

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

  const { receiptNumber, messages } = body as { receiptNumber?: unknown; messages?: unknown };
  if (typeof receiptNumber !== "string" || !receiptNumber) {
    return NextResponse.json({ error: "receiptNumber is required." }, { status: 400 });
  }
  if (!isValidMessages(messages)) {
    return NextResponse.json(
      { error: "messages must be a non-empty array ending with a user message." },
      { status: 400 }
    );
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
        error: `You've used all ${usage.limit} free questions this month. Upgrade to CaseWhy Plus for unlimited questions.`,
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
    const result = await chatAboutCase(status, messages);
    await incrementChatUsage(session.user.id);
    const updatedUsage = await getChatUsage(session.user.id, tier);
    return NextResponse.json({ ...result, usage: updatedUsage });
  } catch {
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
