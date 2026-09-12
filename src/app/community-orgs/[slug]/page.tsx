import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityOrgBySlug } from "@/lib/community-orgs/directory";
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
  const org = await getCommunityOrgBySlug(slug);
  if (!org) return { title: "Organization not found | CaseWhy" };
  return {
    title: `${org.organizationName} — Community Organization | CaseWhy`,
    description: `${org.organizationName}, a community organization serving immigrants. Free directory, informational listing only.`,
  };
}

export default async function CommunityOrgDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getCommunityOrgBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/community-orgs" label="All community organizations" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{org.organizationName}</h1>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        {org.cityStateZip && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Location</p>
            <p className="mt-1">{org.cityStateZip}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            USCIS grant recipient
          </p>
          <p className="mt-1">{org.fiscalYearsAwarded}</p>
        </div>
        {org.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">About</p>
            <p className="mt-1">{org.description}</p>
          </div>
        )}
      </div>

      {org.websiteUrl && (
        <a
          href={org.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Visit website
        </a>
      )}

      <p className="mt-6 text-xs text-muted">{org.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current details directly with the organization before relying on anyone.
      </p>

      <div className="mt-6">
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/community-orgs/${org.slug}`}
          title={org.organizationName}
          text={`Found this on CaseWhy — ${org.organizationName}, a free community/cultural organization resource — thought you should see it.`}
        />
        <ReportListingLink
          entityType="community_org"
          entityId={org.id}
          entityName={org.organizationName}
        />
      </div>
    </main>
  );
}
