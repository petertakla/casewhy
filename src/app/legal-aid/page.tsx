import Link from "next/link";
import { getLegalAidDirectory, LEGAL_AID_DIRECTORY_DISCLAIMER } from "@/lib/legal-aid/directory";
import { StateFilter } from "@/components/StateFilter";

// Unlike /attorneys (a static in-source array), this reads a real DB table
// that gets re-seeded periodically — without forcing dynamic rendering,
// Next.js would prerender this once at build time and freeze the list until
// the next deploy. Same reasoning as /accredited-representatives.
export const dynamic = "force-dynamic";

export default async function LegalAidPage() {
  const directory = await getLegalAidDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find a legal aid organization</h1>
      <p className="mb-2 mt-2 text-muted">
        Nonprofit organizations recognized by the DOJ to provide immigration legal help, often at
        low or no cost. Sourced from DOJ&apos;s own public roster, nationwide.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {LEGAL_AID_DIRECTORY_DISCLAIMER}
      </p>
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
        <StateFilter
          emptyMessage="No legal aid organizations match."
          items={directory.map((org) => ({
            key: org.id,
            states: [org.state],
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""} ${org.streetAddress ?? ""}`,
            node: (
              <Link
                href={`/legal-aid/${org.slug}`}
                className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-foreground">{org.organizationName}</p>
                  <p className="text-xs text-muted">{org.state}</p>
                </div>
                {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
              </Link>
            ),
          }))}
        />
      )}

      <p className="mt-8 text-sm text-muted">
        Run a nonprofit providing immigration legal help?{" "}
        <Link href="/legal-aid/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
