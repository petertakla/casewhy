import Link from "next/link";
import {
  getAccreditedRepresentativeDirectory,
  ACCREDITED_REPRESENTATIVE_DIRECTORY_DISCLAIMER,
} from "@/lib/accredited-representatives/directory";

// Unlike /attorneys (a static in-source array), this reads a real DB table
// that gets re-seeded periodically and grows via approved applications —
// without forcing dynamic rendering, Next.js would prerender this once at
// build time and freeze the list until the next deploy.
export const dynamic = "force-dynamic";

export default async function AccreditedRepresentativesPage() {
  const directory = await getAccreditedRepresentativeDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find an accredited representative</h1>
      <p className="mb-2 mt-2 text-muted">
        DOJ-accredited representatives — non-lawyers authorized to practice immigration law,
        typically at nonprofit organizations. Sourced from DOJ&apos;s own public roster,
        Florida-first.
      </p>
      <p className="mb-2 text-xs text-muted">{ACCREDITED_REPRESENTATIVE_DIRECTORY_DISCLAIMER}</p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, the
            Department of Justice publishes its own{" "}
            <a
              href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              Recognized Organizations and Accredited Representatives roster
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {directory.map((rep) => (
            <Link
              key={rep.id}
              href={`/accredited-representatives/${rep.slug}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-foreground">{rep.representativeName}</p>
                <p className="text-xs text-muted">{rep.state}</p>
              </div>
              <p className="text-sm text-muted">{rep.organizationName}</p>
              <p className="mt-1 text-xs text-muted">
                {rep.dhsOnly ? "DHS only" : "Full accreditation"}
                {rep.accreditationPendingRenewal ? " · renewal pending" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-muted">
        Represent a nonprofit with DOJ-accredited staff?{" "}
        <Link href="/accredited-representatives/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
