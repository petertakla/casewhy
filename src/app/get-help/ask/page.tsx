import type { Metadata } from "next";
import { AnonymousChat } from "./AnonymousChat";

export const metadata: Metadata = {
  title: "Ask CaseWhy — Free Immigration Questions Answered | CaseWhy",
  description:
    "Ask a general question about USCIS processes, statuses, or terms — free, no sign-in required, grounded in CaseWhy's curated policy knowledge base.",
};

// Round 60 Phase B — a genuinely zero-friction anonymous question-answering
// surface: no sign-in, no tracked case. Deliberately its own route/
// component, not /ask (the case-grounded chat), which requires sign-in and
// a real tracked case — see src/lib/get-help/anonymous-chat.ts for what's
// in and out of scope here.

export default function GetHelpAskPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Ask CaseWhy</h1>
      <p className="mt-2 text-muted">
        Free, no sign-in required. Ask a general question about USCIS processes, statuses, or
        terms — grounded in CaseWhy&apos;s own policy knowledge base, not in any specific
        person&apos;s case.
      </p>
      <p className="mt-2 text-xs text-muted">
        Not legal advice. For anything specific to your own case, sign in and track it — or find a
        licensed professional on the{" "}
        <a href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
          Get Help
        </a>{" "}
        page.
      </p>

      <div className="mt-6">
        <AnonymousChat />
      </div>
    </main>
  );
}
