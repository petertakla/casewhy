import Link from "next/link";
import { ATTORNEY_DIRECTORY, ATTORNEY_DIRECTORY_DISCLAIMER } from "@/lib/attorneys/directory";

export default function AttorneysPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find an attorney</h1>
      <p className="mb-2 mt-2 text-muted">
        A hand-curated list of immigration attorneys, for anything CaseWhy tells you needs a
        licensed professional&apos;s judgment rather than general information.
      </p>
      <p className="mb-2 text-xs text-muted">{ATTORNEY_DIRECTORY_DISCLAIMER}</p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {ATTORNEY_DIRECTORY.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, the American
            Immigration Lawyers Association keeps a{" "}
            <a
              href="https://www.ailalawyer.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              searchable directory of its own members
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ATTORNEY_DIRECTORY.map((attorney) => (
            <Link
              key={attorney.id}
              href={`/attorneys/${attorney.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-foreground">{attorney.name}</p>
                <p className="text-xs text-muted">{attorney.statesLicensed.join(", ")}</p>
              </div>
              <p className="text-sm text-muted">{attorney.firm}</p>
              <p className="mt-2 text-xs text-muted">{attorney.practiceFocus.join(" · ")}</p>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-muted">
        Licensed immigration attorney?{" "}
        <Link href="/attorneys/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
