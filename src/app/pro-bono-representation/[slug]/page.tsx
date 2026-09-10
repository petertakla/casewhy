import { notFound } from "next/navigation";
import { getProBonoRepresentationBySlug } from "@/lib/pro-bono-representation/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";

export default async function ProBonoRepresentationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getProBonoRepresentationBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/pro-bono-representation" label="All pro bono representation" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {org.organizationName}
        {org.isReferralService && (
          <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 align-middle text-xs font-normal text-muted">
            Referral service
          </span>
        )}
      </h1>
      <p className="mt-1 text-muted">{org.immigrationCourt}</p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        {(org.streetAddress || org.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Address</p>
            <p className="mt-1">
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
        {org.languages && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Languages</p>
            <p className="mt-1">{org.languages}</p>
          </div>
        )}
        {org.caseTypeLimits && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Case-type limits</p>
            <p className="mt-1">{org.caseTypeLimits}</p>
          </div>
        )}
        {org.intakePolicy && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Intake policy</p>
            <p className="mt-1">{org.intakePolicy}</p>
          </div>
        )}
      </div>

      {org.website && (
        <a
          href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Visit website
        </a>
      )}

      <p className="mt-6 text-xs text-muted">{org.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        EOIR does not endorse any of these organizations, referral services, or attorneys.
        Publication of this list does not constitute an endorsement by EOIR, and omission does not
        constitute a disapproval. EOIR does not participate in, nor is it responsible for, the
        representation decisions or performance of counsel on this list. Always confirm current
        details directly with the organization before relying on anyone.
      </p>

      <div className="mt-6">
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/pro-bono-representation/${org.slug}`}
          title={org.organizationName}
          text={`Found this on CaseWhy — ${org.organizationName}, free pro bono representation for ${org.immigrationCourt} — thought you should see it.`}
        />
        <ReportListingLink
          entityType="pro_bono_representation"
          entityId={org.id}
          entityName={org.organizationName}
        />
      </div>
    </main>
  );
}
