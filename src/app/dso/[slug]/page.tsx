import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDsoBySlug } from "@/lib/dso/directory";
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
  const school = await getDsoBySlug(slug);
  if (!school) return { title: "School not found | CaseWhy" };
  return {
    title: `${school.schoolName} — International Student Office | CaseWhy`,
    description: `SEVP-certified school listing for ${school.schoolName}${school.campusName && school.campusName !== school.schoolName ? ` (${school.campusName})` : ""}. Free directory, informational listing only.`,
  };
}

export default async function DsoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = await getDsoBySlug(slug);
  if (!school) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/dso" label="All schools" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{school.schoolName}</h1>
      {school.campusName && school.campusName !== school.schoolName && (
        <p className="mt-1 text-muted">
          {school.campusName}
          {school.isMainCampus ? " (main campus)" : ""}
        </p>
      )}

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">SEVP certification</p>
          <p className="mt-1">
            {[school.f1Certified && "F-1", school.m1Certified && "M-1"].filter(Boolean).join(" and ")}
          </p>
        </div>
        {(school.streetAddress || school.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Address</p>
            <p className="mt-1">
              {school.streetAddress && <>{school.streetAddress}<br /></>}
              {school.cityStateZip}
            </p>
          </div>
        )}
        {school.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Phone</p>
            <p className="mt-1">{school.phone}</p>
          </div>
        )}
      </div>

      {school.websiteUrl ? (
        <a
          href={school.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Visit international student office website
        </a>
      ) : (
        <p className="mt-6 text-sm text-muted">
          A direct international-student-office link isn&apos;t confirmed for this school yet —{" "}
          <a
            href="https://studyinthestates.dhs.gov/school-search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline dark:text-brand-400"
          >
            search DHS&apos;s own school directory
          </a>{" "}
          or contact the school directly.
        </p>
      )}

      <p className="mt-6 text-xs text-muted">{school.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current details directly with the school before relying on anyone.
      </p>

      <div className="mt-6">
        <VerificationLinks name={school.schoolName} context={school.cityStateZip ?? undefined} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/dso/${school.slug}`}
          title={school.schoolName}
          text={`Found this on CaseWhy — ${school.schoolName}'s international student office listing — thought you should see it.`}
        />
        <ReportListingLink entityType="dso" entityId={school.id} entityName={school.schoolName} />
      </div>
    </main>
  );
}
