import { notFound } from "next/navigation";
import { getAttorneyBySlug } from "@/lib/attorneys/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";

// Round 40 — now reads a real DB table by slug rather than the static
// array's id field. Directory param name kept as [id] (unchanged route)
// even though the lookup is by slug now, to avoid touching every existing
// link into this route for a rename that carries no user-facing benefit.
export default async function AttorneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attorney = await getAttorneyBySlug(id);
  if (!attorney) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/attorneys" label="All attorneys" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{attorney.name}</h1>
      {attorney.firm && <p className="mt-1 text-muted">{attorney.firm}</p>}

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">States licensed</p>
          <p className="mt-1">{attorney.statesLicensed.join(", ")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Practice focus</p>
          <p className="mt-1">{attorney.practiceFocus.join(", ")}</p>
        </div>
        {(attorney.streetAddress || attorney.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Office</p>
            <p className="mt-1">
              {attorney.streetAddress && <>{attorney.streetAddress}<br /></>}
              {attorney.cityStateZip}
            </p>
          </div>
        )}
        {attorney.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Phone</p>
            <p className="mt-1">{attorney.phone}</p>
          </div>
        )}
      </div>

      {attorney.websiteUrl && (
        <a
          href={attorney.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Visit website
        </a>
      )}

      {attorney.sourceCitation && <p className="mt-6 text-xs text-muted">{attorney.sourceCitation}</p>}
      <p className="mt-2 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current bar standing yourself before hiring anyone.
      </p>

      <div className="mt-6">
        <ReportListingLink entityType="attorney" entityId={attorney.id} entityName={attorney.name} />
      </div>
    </main>
  );
}
