import { notFound } from "next/navigation";
import { getLegalAidBySlug } from "@/lib/legal-aid/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";

export default async function LegalAidDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getLegalAidBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/legal-aid" label="All legal aid organizations" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{org.organizationName}</h1>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Recognition status</p>
          <p className="mt-1">
            {org.organizationStatus}
            {org.organizationRecognitionExpiration && (
              <>
                {" "}
                — recognition expires {org.organizationRecognitionExpiration}
                {org.organizationRecognitionPendingRenewal && " (renewal pending)"}
              </>
            )}
          </p>
        </div>
        {(org.officeType || org.streetAddress || org.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Office</p>
            <p className="mt-1">
              {org.officeType && <>{org.officeType}<br /></>}
              {org.streetAddress && <>{org.streetAddress}<br /></>}
              {org.cityStateZip}
            </p>
          </div>
        )}
        {org.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Phone</p>
            <p className="mt-1">{org.phone}</p>
          </div>
        )}
        {org.servicesOffered && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Services offered</p>
            <p className="mt-1">{org.servicesOffered}</p>
          </div>
        )}
        {org.populationServed && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Population served</p>
            <p className="mt-1">{org.populationServed}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted">{org.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current details yourself before relying on anyone —{" "}
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
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/legal-aid/${org.slug}`}
          title={org.organizationName}
          text={`Found this on CaseWhy — ${org.organizationName}, a free/low-cost legal aid resource — thought you should see it.`}
        />
        <ReportListingLink
          entityType="legal_aid"
          entityId={org.id}
          entityName={org.organizationName}
        />
      </div>
    </main>
  );
}
