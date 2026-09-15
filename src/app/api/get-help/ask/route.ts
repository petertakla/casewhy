// Round 60 Phase B — the anonymous "ask CaseWhy" API route. No auth check
// by design (that's the whole point of this surface) — the only gate is
// the rate limit below. Deliberately a separate route/component from
// /api/chat (the case-grounded chat) rather than reusing it, since the
// two have genuinely different auth requirements and guardrail scope —
// see src/lib/get-help/anonymous-chat.ts.

import { NextRequest, NextResponse } from "next/server";
import { askAnonymousQuestion, type AnonymousChatMessage } from "@/lib/get-help/anonymous-chat";
import {
  clientKeyFromHeaders,
  getAnonymousQuestionUsage,
  incrementAnonymousQuestionUsage,
  LIFETIME_CAP_PER_IP,
} from "@/lib/get-help/anonymous-usage";

const MAX_MESSAGE_LENGTH = 2000;

function isValidMessages(value: unknown): value is AnonymousChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (m): m is AnonymousChatMessage =>
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

// Round 105 — the client now sends its own chrome locale (page.tsx's `es`
// prop) alongside the message, purely so these three server-owned error
// strings can match it. This is a UI nicety, not a security/validation
// signal, so an absent or bogus `lang` just falls back to English rather
// than being treated as untrusted input that needs rejecting.
function isSpanishLang(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as { lang?: unknown }).lang === "es";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const es = isSpanishLang(body);

  const clientKey = clientKeyFromHeaders(request.headers);
  const usage = await getAnonymousQuestionUsage(clientKey);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: es
          ? `Ha usado sus ${LIFETIME_CAP_PER_IP} preguntas gratis. Inicie sesión y rastree un caso para preguntas ilimitadas sobre él.`
          : `You've used all ${LIFETIME_CAP_PER_IP} free questions. Sign in and track a case for unlimited questions about it.`,
        limitReached: true,
      },
      { status: 429 }
    );
  }

  const { messages } = body as { messages?: unknown };
  if (!isValidMessages(messages)) {
    return NextResponse.json(
      { error: "messages must be a non-empty array ending with a user message." },
      { status: 400 }
    );
  }

  try {
    const reply = await askAnonymousQuestion(messages);
    // Round 71 — only counted against the lifetime cap on a real, successful
    // reply, same "don't burn a question on a failed call" rule as
    // src/lib/billing/chat-usage.ts.
    await incrementAnonymousQuestionUsage(clientKey);
    return NextResponse.json({ reply, remaining: usage.remaining - 1 });
  } catch {
    return NextResponse.json(
      {
        error: es
          ? "El asistente no está disponible temporalmente. Inténtelo de nuevo en breve."
          : "The assistant is temporarily unavailable. Please try again shortly.",
      },
      { status: 502 }
    );
  }
}
