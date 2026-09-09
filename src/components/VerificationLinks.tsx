// Round 48 — one shared "do your own research on this listing" line, on
// every Get Help entity-type detail/permalink page (never the list pages,
// per the task's explicit instruction). Reused across attorneys, accredited
// representatives, legal aid orgs, DSOs, and community orgs — same pattern
// as <StateFilter>/<BackLink>.
//
// The two links are deliberately labeled differently, not presented as
// equivalent "verify this" buttons: Google search returns real web results
// a user can independently judge (bar-association profiles, reviews, the
// org's own site) — the actual verification tool. The AI link is a
// general-info assistant, not verification — an LLM's synthesized answer
// carries real hallucination risk on exactly the question that matters most
// here (is this person actually licensed, is this org still operating), so
// it's labeled as asking a question, never as checking or confirming
// anything.
//
// Round 51 — swapped Gemini for ChatGPT. Gemini's consumer web app has no
// supported URL parameter for prefilling a prompt at all. ChatGPT's
// `?q=`/`?prompt=` parameter does pre-fill the composer with the query on
// load — confirmed live — though it stops short of auto-submitting (needs
// one more click from the visitor), short of what was originally hoped for
// but still real, on-page context instead of a blank chat.

export function VerificationLinks({ name, context }: { name: string; context?: string }) {
  const query = context ? `"${name}" ${context}` : `"${name}"`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(query)}`;

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
        href={chatGptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-600 hover:underline dark:text-brand-400"
      >
        Ask ChatGPT about {name}
      </a>
    </div>
  );
}
