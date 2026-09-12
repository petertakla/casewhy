import type { Metadata } from "next";
import Link from "next/link";
import {
  getProBonoRepresentationDirectory,
  PRO_BONO_REPRESENTATION_DISCLAIMER,
} from "@/lib/pro-bono-representation/directory";

export const metadata: Metadata = {
  title: "Find Free Immigration Court Representation | CaseWhy",
  description:
    "Directory of organizations offering free representation in immigration court (removal defense) proceedings, organized by court.",
};
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const dynamic = "force-dynamic";

export default async function ProBonoRepresentationPage() {
  const directory = await getProBonoRepresentationDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find pro bono immigration-court representation</h1>
      <p className="mb-2 mt-2 text-muted">
        Organizations offering free representation in immigration court proceedings (removal
        defense), organized by the immigration court they serve — a more specific, often
        higher-stakes need than general legal aid.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {PRO_BONO_REPRESENTATION_DISCLAIMER}
      </p>
      <p className="mb-8 text-xs text-muted">
        Free to browse, always — no fees, no ads, no sign-in required.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, EOIR
            publishes its own{" "}
            <a
              href="https://www.justice.gov/eoir/list-pro-bono-legal-service-providers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              List of Pro Bono Legal Service Providers
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
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""} ${org.immigrationCourt}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/pro-bono-representation/${org.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {org.organizationName}
                      {org.isReferralService && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">
                          Referral service
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{org.state}</p>
                  </div>
                  {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
                  <p className="mt-1 text-xs text-muted">{org.immigrationCourt}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="pro_bono_representation"
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
        Provide pro bono immigration-court representation?{" "}
        <Link href="/pro-bono-representation/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>{" "}
        — free, no cost to join.
      </p>
    </main>
  );
}
