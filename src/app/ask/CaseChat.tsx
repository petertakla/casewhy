"use client";

import { useState } from "react";
import Link from "next/link";
import { suggestedQuestions } from "@/lib/ai/suggested-questions";
import { linkifyExplanation } from "@/lib/kb/linkify";

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

export function CaseChat({
  receiptNumber,
  statusText,
  formType,
}: {
  receiptNumber: string;
  /** Case's current status/form type, for the contextual suggested-question pills below. */
  statusText?: string;
  formType?: string;
}) {
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

  // Round 21 follow-up — Peter reported the same pill sitting there after
  // being asked. Pills now come from an ordered pool (suggestedQuestions no
  // longer caps it); once a pill is used it drops out of the visible window
  // and the next unused one from the pool slides in, so there's always a
  // fresh suggestion rather than the same one repeating.
  const pool = statusText && formType ? suggestedQuestions(statusText, formType) : [];
  const [usedPills, setUsedPills] = useState<Set<string>>(new Set());
  const pills = pool.filter((q) => !usedPills.has(q)).slice(0, 3);

  async function send(override?: string) {
    const text = (override ?? input).trim();
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
        // The question that hits the cap still succeeds (the server only
        // blocks the *next* attempt) — sync limitReached here too, not just
        // on the eventual 402, so the upgrade message shows right after
        // this reply lands instead of after a wasted extra attempt.
        if (data.usage.limitReached) setLimitReached(true);
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
              {/* New task, same day as round 29/30 — assistant replies get the
                  same always-on TERM_LINKS pass (src/lib/kb/term-links.ts) the
                  dashboard explanation already uses, so a guardrail's own
                  "consult an attorney" redirect becomes a real /get-help
                  link. No per-case relatedPolicies here (chat only tracks the
                  latest response's, not per-message), so [] — TERM_LINKS
                  still fires regardless. User's own text is never linkified. */}
              <p className="whitespace-pre-wrap">
                {m.role === "assistant" ? linkifyExplanation(m.content, []) : m.content}
              </p>
            </div>
          </div>
        ))}
        {pending && <p className="text-sm text-muted">Thinking…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="border-t border-border p-4">
        {limitReached && (
          <div className="mb-3 rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-sm">
            <p className="font-medium text-foreground">
              You&apos;ve used all {usage?.limit ?? "your free"} questions this month.
            </p>
            <p className="mt-1 text-muted">
              Get unlimited questions with{" "}
              <Link href="/plus#ai-chat" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                CaseWhy Plus
              </Link>{" "}
              — every answer still grounded in real USCIS policy, with citations.
            </p>
          </div>
        )}
        {pills.length > 0 && !limitReached && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pills.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                onClick={() => {
                  setUsedPills((prev) => new Set(prev).add(q));
                  send(q);
                }}
                className="rounded-full border border-border-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:border-brand-500 disabled:opacity-60 dark:text-brand-400"
              >
                {q}
              </button>
            ))}
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
          licensed professional —{" "}
          <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
            get help finding one
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
