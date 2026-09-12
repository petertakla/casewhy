import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccreditedRepresentativeBySlug } from "@/lib/accredited-representatives/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rep = await getAccreditedRepresentativeBySlug(slug);
  if (!rep) return { title: "Representative not found | CaseWhy" };
  return {
    title: `${rep.representativeName} — ${rep.organizationName} | CaseWhy`,
    description: `DOJ-accredited representative ${rep.representativeName} at ${rep.organizationName}. Free directory, informational listing only.`,
  };
}

export default async function AccreditedRepresentativeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rep = await getAccreditedRepresentativeBySlug(slug);
  if (!rep) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/accredited-representatives" label="All accredited representatives" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{rep.representativeName}</h1>
      <p className="mt-1 text-muted">{rep.organizationName}</p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Accreditation</p>
          <p className="mt-1">
            {rep.dhsOnly ? "DHS only" : "Full accreditation"}
            {rep.accreditationExpiration && (
              <>
                {" "}
                — expires {rep.accreditationExpiration}
                {rep.accreditationPendingRenewal && " (renewal pending)"}
              </>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Organization status</p>
          <p className="mt-1">
            {rep.organizationStatus}
            {rep.organizationRecognitionExpiration && (
              <>
                {" "}
                — recognition expires {rep.organizationRecognitionExpiration}
                {rep.organizationRecognitionPendingRenewal && " (renewal pending)"}
              </>
            )}
          </p>
        </div>
        {(rep.officeType || rep.streetAddress || rep.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Office</p>
            <p className="mt-1">
              {rep.officeType && <>{rep.officeType}<br /></>}
              {rep.streetAddress && <>{rep.streetAddress}<br /></>}
              {rep.cityStateZip}
            </p>
          </div>
        )}
        {rep.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Phone</p>
            <p className="mt-1">{rep.phone}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted">{rep.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current accreditation yourself before relying on anyone —{" "}
        <a
          href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          DOJ&apos;s own roster
        </a>
        .
      </p>

      <div className="mt-6">
        <VerificationLinks
          name={rep.representativeName}
          context={[rep.organizationName, rep.cityStateZip].filter(Boolean).join(" ")}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/accredited-representatives/${rep.slug}`}
          title={rep.representativeName}
          text={`Found this on CaseWhy — ${rep.representativeName} at ${rep.organizationName}, a free DOJ-accredited representative directory listing — thought you should see it.`}
        />
        <ReportListingLink
          entityType="accredited_representative"
          entityId={rep.id}
          entityName={rep.representativeName}
        />
      </div>
    </main>
  );
}
