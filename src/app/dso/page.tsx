import Link from "next/link";
import { getDsoDirectory, DSO_DIRECTORY_DISCLAIMER } from "@/lib/dso/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

// Same reasoning as every other entity-type list page: reads a real DB
// table that gets re-seeded periodically, so force dynamic rendering
// rather than letting Next.js prerender and freeze it at build time.
export const dynamic = "force-dynamic";

export default async function DsoPage() {
  const directory = await getDsoDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find your school&apos;s international office</h1>
      <p className="mb-2 mt-2 text-muted">
        SEVP-certified schools authorized to enroll F-1/M-1 international students, sourced from
        DHS&apos;s own official school directory. DHS doesn&apos;t publish a Designated School
        Official&apos;s name or contact info for any school — this links out to each school so you
        can reach its international student office directly.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {DSO_DIRECTORY_DISCLAIMER}
      </p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, DHS
            publishes its own{" "}
            <a
              href="https://studyinthestates.dhs.gov/school-search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              School Search tool
            </a>
            .
          </p>
        </div>
      ) : (
        <StateFilter
          emptyMessage="No schools match."
          items={directory.map((school) => ({
            key: school.id,
            states: [school.state],
            searchText: `${school.schoolName} ${school.campusName ?? ""} ${school.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/dso/${school.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{school.schoolName}</p>
                    <p className="text-xs text-muted">{school.state}</p>
                  </div>
                  {school.campusName && school.campusName !== school.schoolName && (
                    <p className="text-sm text-muted">{school.campusName}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {[school.f1Certified && "F-1", school.m1Certified && "M-1"]
                      .filter(Boolean)
                      .join(" · ")}
                    {school.isMainCampus ? " · Main campus" : ""}
                  </p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink entityType="dso" entityId={school.id} entityName={school.schoolName} />
                </div>
              </div>
            ),
          }))}
        />
      )}

      <p className="mt-8 text-sm text-muted">
        A Designated School Official?{" "}
        <Link href="/dso/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Add your contact info
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
