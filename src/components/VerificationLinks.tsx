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
// Gemini's prefill URL format could NOT be confirmed live in this session
// — an ad-injecting browser extension overlay blocked the real Gemini UI
// during testing, and that testing would have had to happen on a real,
// signed-in personal Google account rather than a disposable one, which
// wasn't a safe way to verify a URL format either. Per the task's own
// explicit fallback instruction, this ships a plain (non-prefilled) link
// to https://gemini.google.com/app rather than guessing at a query
// parameter that might silently fail. Revisit if a reliable format is
// confirmed later.

export function VerificationLinks({ name, context }: { name: string; context?: string }) {
  const query = context ? `"${name}" ${context}` : `"${name}"`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

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
      <a
        href="https://gemini.google.com/app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-600 hover:underline dark:text-brand-400"
      >
        Ask Gemini about {name}
      </a>
    </div>
  );
}
