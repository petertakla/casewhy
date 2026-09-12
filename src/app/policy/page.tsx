import type { Metadata } from "next";
import Link from "next/link";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";
import { ShareButton } from "@/components/ShareButton";

// Round 73 — the public, indexable mirror of the policy-memo knowledge
// base that already powers CaseWhy's in-app, per-case explanations
// (CW-31). This is a publishing step, not new research: same
// POLICY_MEMOS array, same list+permalink shape as /news, just given a
// real list page so the permalinks (previously only reachable from inside
// a signed-in case explanation) are actually discoverable. See
// round73-seo-geo-foundation-task.md item 5.

export const metadata: Metadata = {
  title: "USCIS Policy Memos, Explained | CaseWhy",
  description:
    "Plain-language explanations of major USCIS policy memos, rule changes, and court rulings that can affect a pending immigration case.",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function PolicyIndexPage() {
  const memos = [...POLICY_MEMOS].sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">USCIS policy memos, explained</h1>
      <p className="mb-2 mt-2 text-muted">
        Major USCIS policy changes, memos, and court rulings that can plausibly explain why a
        pending case looks delayed or affected — written once, in plain language, for anyone to
        read, not tied to any specific person&apos;s case.
      </p>
      <p className="mb-8 text-xs text-muted">
        General policy background, not a diagnosis of any specific case. For guidance specific to
        your own case, talk to a licensed immigration attorney.
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/policy"
          title="CaseWhy — USCIS policy memos, explained"
          text="Plain-language explanations of major USCIS policy changes, for free, with CaseWhy."
        />
      </div>

      <div className="space-y-4">
        {memos.map((memo) => (
          <Link
            key={memo.id}
            href={`/policy/${memo.id}`}
            className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {formatDate(memo.datePublished)}
              {memo.memoNumber && <span> · {memo.memoNumber}</span>}
            </p>
            <p className="mt-1.5 font-semibold text-foreground">{memo.title}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
