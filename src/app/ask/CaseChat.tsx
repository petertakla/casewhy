"use client";

import { useState } from "react";

interface RelatedPolicy {
  id: string;
  title: string;
  sourceTitle: string;
  sourceUrl: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UsageStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  limitReached: boolean;
}

export function CaseChat({ receiptNumber }: { receiptNumber: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  // Deterministic per-case (see findRelevantPolicyContext), not per-question
  // — shown once, persistently, rather than attached to each reply, so it
  // doesn't look like it's the reason for an unrelated answer.
  const [relatedPolicies, setRelatedPolicies] = useState<RelatedPolicy[]>([]);

  async function send() {
    const text = input.trim();
    if (!text || pending || limitReached) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNumber, messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setLimitReached(true);
          if (data.usage) setUsage(data.usage);
        }
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (Array.isArray(data.relatedPolicies)) {
        setRelatedPolicies(data.relatedPolicies);
      }
      if (data.usage) {
        setUsage(data.usage);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      {relatedPolicies.length > 0 && (
        <div className="border-b border-border bg-surface-2 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Policy background that may apply to this case
          </p>
          <ul className="mt-1.5 space-y-1 text-xs">
            {relatedPolicies.map((p) => (
              <li key={p.id}>
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {p.title}
                </a>
                <span className="text-muted"> — {p.sourceTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-[60vh] min-h-[240px] space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Ask anything about your case status — for example, &quot;what does this status mean
            for my timeline?&quot; or &quot;why might this be taking longer than usual?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-brand-500 text-white"
                  : "bg-surface-2 text-foreground/90"
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
            placeholder={limitReached ? "Free monthly question limit reached" : "Ask a question about your case…"}
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
        {usage && usage.limit !== null && !limitReached && (
          <p className="mt-2 text-xs text-muted">
            {usage.remaining} of {usage.limit} free questions left this month.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          General information, not legal advice. For guidance specific to your case, talk to a
          licensed immigration attorney.
        </p>
      </div>
    </div>
  );
}
