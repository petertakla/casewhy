import type { Metadata } from "next";
import Link from "next/link";
import { getAttorneyDirectory, ATTORNEY_DIRECTORY_DISCLAIMER } from "@/lib/attorneys/directory";

export const metadata: Metadata = {
  title: "Find an Immigration Attorney | CaseWhy",
  description:
    "Free directory of immigration attorneys — board-certified specialists sourced from official state bar records, plus self-enrolled listings.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/attorneys",
      es: "https://app.casewhy.com/es/attorneys",
    },
  },
};
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

// Round 40 — now reads a real DB table (machine-seeded from state-bar
// board-certification records) rather than the static array round 27
// shipped. Same reasoning as /accredited-representatives and /legal-aid:
// force dynamic rendering so a re-seed shows up without a redeploy.
export const dynamic = "force-dynamic";

export default async function AttorneysPage() {
  const directory = await getAttorneyDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/es/attorneys" hrefLang="es" lang="es" className="text-brand-600 hover:underline dark:text-brand-400">
          Español
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Find an attorney</h1>
      <p className="mb-2 mt-2 text-muted">
        Immigration attorneys — board-certified specialists sourced from official state bar
        records, plus self-enrolled listings — for anything CaseWhy tells you needs a licensed
        professional&apos;s judgment rather than general information.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {ATTORNEY_DIRECTORY_DISCLAIMER}
      </p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {directory.length === 0 ? (
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
        <StateFilter
          emptyMessage="No attorneys match."
          items={directory.map((attorney) => ({
            key: attorney.id,
            states: attorney.statesLicensed,
            searchText: `${attorney.name} ${attorney.firm ?? ""} ${attorney.practiceFocus.join(" ")} ${attorney.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/attorneys/${attorney.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{attorney.name}</p>
                    <p className="text-xs text-muted">{attorney.statesLicensed.join(", ")}</p>
                  </div>
                  {attorney.firm && <p className="text-sm text-muted">{attorney.firm}</p>}
                  <p className="mt-2 text-xs text-muted">{attorney.practiceFocus.join(" · ")}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="attorney"
                    entityId={attorney.id}
                    entityName={attorney.name}
                  />
                </div>
              </div>
            ),
          }))}
        />
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
