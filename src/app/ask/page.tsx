import Link from "next/link";

export default function AskPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
      <p className="mt-2 text-muted">
        A conversational way to ask about your case, grounded in CaseWhy&apos;s policy knowledge
        base — coming soon.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-border-strong p-6">
        <p className="text-sm text-muted">
          This is being built now. In the meantime, the same policy background this feature will
          draw on already grounds the explanation on your{" "}
          <Link href="/dashboard" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            case dashboard
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
