"use client";

import { useState, useTransition } from "react";
import { subscribeEmail } from "./actions";

/**
 * Round 6 — real pre-launch email capture, replacing the previous bare
 * <form> with no action (which just reloaded the page with the email
 * dumped into the URL query string and captured nothing).
 */
export function EmailCaptureForm({
  ctaLabel,
  sourcePage,
}: {
  ctaLabel: string;
  sourcePage: "landing-hero" | "landing-footer";
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await subscribeEmail({ email, sourcePage, website });
      if (result.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (status === "success") {
    return (
      <p className="mt-8 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        You&apos;re on the list — we&apos;ll email you when CaseWhy is ready.
      </p>
    );
  }

  return (
    <div className="mt-8 w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
        />
        {/* Honeypot — hidden from real visitors via CSS, not a type="hidden"
            input a form-filling bot would recognize and skip. */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting…" : ctaLabel}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
