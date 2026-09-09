"use client";

import { useState } from "react";

// Round 48 — one shared "do your own research on this listing" line, on
// every Get Help entity-type detail/permalink page (never the list pages,
// per the task's explicit instruction). Reused across attorneys, accredited
// representatives, legal aid orgs, DSOs, and community orgs — same pattern
// as <StateFilter>/<BackLink>.
//
// The two links are deliberately labeled differently, not presented as
// equivalent "verify this" buttons: Google search returns real web results
// a user can independently judge (bar-association profiles, reviews, the
// org's own site) — the actual verification tool. Gemini is a general-info
// assistant, not verification — an LLM's synthesized answer carries real
// hallucination risk on exactly the question that matters most here (is
// this person actually licensed, is this org still operating), so it's
// labeled as asking a question, never as checking or confirming anything.
//
// Round 51 — Gemini's consumer web app has no supported URL parameter for
// prefilling a prompt at all (confirmed directly this round, not just a
// testing artifact of round 48's ad-overlay interference), so there's no
// query-string format to discover. Real fix: copy the constructed query to
// the clipboard before opening Gemini, same clipboard pattern already used
// by ShareButton.tsx's copy-link button, with a brief toast so the visitor
// knows to paste rather than facing a blank chat. Falls back to a plain
// open with no toast if clipboard access fails.

export function VerificationLinks({ name, context }: { name: string; context?: string }) {
  const [copied, setCopied] = useState(false);
  const query = context ? `"${name}" ${context}` : `"${name}"`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  async function handleGeminiClick() {
    // Open synchronously, on the click itself, so popup blockers don't
    // treat the async clipboard call below as breaking the user gesture.
    window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard API unavailable/denied — Gemini still opened above, no
      // broken tooltip.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-600 hover:underline dark:text-brand-400"
      >
        Search {name} on Google
      </a>
      <span className="relative inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleGeminiClick}
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Ask Gemini about {name}
        </button>
        {copied && <span className="text-muted">Query copied — paste it into Gemini</span>}
      </span>
    </div>
  );
}
