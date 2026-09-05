import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getTrackedReceiptNumber } from "@/app/dashboard/actions";
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

  // Re-derived server-side from the authenticated session every time, not
  // trusted from the client — the client only ever sends the conversation.
  const receiptNumber = await getTrackedReceiptNumber(session.user.id);
  if (!receiptNumber) {
    return NextResponse.json(
      { error: "Track a case on your dashboard first." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!isValidMessages(messages)) {
    return NextResponse.json(
      { error: "messages must be a non-empty array ending with a user message." },
      { status: 400 }
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
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
