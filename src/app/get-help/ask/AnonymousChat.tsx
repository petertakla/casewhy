"use client";

import { useState } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What does RFE mean?",
  "What's the visa bulletin?",
  "How does adjustment of status work?",
  "What happens after biometrics?",
];

export function AnonymousChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || pending || limitReached) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/get-help/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setLimitReached(true);
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="max-h-96 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                onClick={() => send(q)}
                className="rounded-full border border-border-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:border-brand-500 disabled:opacity-60 dark:text-brand-400"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-xl px-4 py-2.5 text-left text-sm ${
                m.role === "user" ? "bg-brand-500 text-white" : "bg-surface-2 text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {pending && <p className="text-sm text-muted">Thinking…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="border-t border-border p-4">
        {limitReached && (
          <div className="mb-3 rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-sm">
            <p className="font-medium text-foreground">You&apos;ve used all 3 free questions.</p>
            <p className="mt-1 text-muted">
              <Link href="/auth/sign-up" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Sign in and track a case
              </Link>{" "}
              for unlimited questions about it.
            </p>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? "Free question limit reached" : "Ask a general USCIS process question…"}
            aria-label="Your question"
            disabled={pending || limitReached}
            className="flex-1 rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || limitReached || !input.trim()}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
        <p className="mt-3 text-xs text-muted">
          General USCIS process information, not legal advice, and not grounded in any specific
          case.{" "}
          <Link href="/auth/sign-up" className="text-brand-600 hover:underline dark:text-brand-400">
            Sign in and track a case
          </Link>{" "}
          to ask about your own case specifically.
        </p>
      </div>
    </div>
  );
}
