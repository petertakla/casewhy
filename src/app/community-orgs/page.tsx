import type { Metadata } from "next";
import Link from "next/link";
import { getCommunityOrgDirectory, COMMUNITY_ORG_DIRECTORY_DISCLAIMER } from "@/lib/community-orgs/directory";

export const metadata: Metadata = {
  title: "Find a Community or Cultural Organization | CaseWhy",
  description:
    "Directory of community and cultural organizations that received a federal USCIS grant for citizenship instruction and naturalization help.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/community-orgs",
      es: "https://app.casewhy.com/es/community-orgs",
    },
  },
};
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const dynamic = "force-dynamic";

export default async function CommunityOrgsPage() {
  const directory = await getCommunityOrgDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/es/community-orgs" hrefLang="es" lang="es" className="text-brand-600 hover:underline dark:text-brand-400">
          Español
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Find a community or cultural organization</h1>
      <p className="mb-2 mt-2 text-muted">
        Community and cultural organizations that have received a federal USCIS grant specifically
        for citizenship instruction and naturalization help. This reflects organizations that won
        this specific grant — not all community organizations serving immigrants.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {COMMUNITY_ORG_DIRECTORY_DISCLAIMER}
      </p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, USCIS
            publishes its own{" "}
            <a
              href="https://www.uscis.gov/citizenship-resource-center/grant-program-impact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              Citizenship and Integration Grant Program recipient records
            </a>
            .
          </p>
        </div>
      ) : (
        <StateFilter
          emptyMessage="No organizations match."
          items={directory.map((org) => ({
            key: org.id,
            states: [org.state],
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/community-orgs/${org.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{org.organizationName}</p>
                    <p className="text-xs text-muted">{org.state}</p>
                  </div>
                  {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
                  <p className="mt-1 text-xs text-muted">USCIS grant recipient — {org.fiscalYearsAwarded}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="community_org"
                    entityId={org.id}
                    entityName={org.organizationName}
                  />
                </div>
              </div>
            ),
          }))}
        />
      )}

      <p className="mt-8 text-sm text-muted">
        Run a community or cultural organization serving immigrants?{" "}
        <Link href="/community-orgs/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
