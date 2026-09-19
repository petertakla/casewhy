import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site/metadata";
import { auth } from "@/lib/auth/server";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";
import { getManagePlanData } from "../actions";
import { ManagePlanClient } from "./ManagePlanClient";

export const metadata: Metadata = pageMetadata("/plus/manage", {
  title: "Manage your plan | CaseWhy Plus",
  description: "Switch between CaseWhy Plus plans, update your payment method, or cancel.",
});

// Round 115, Part 1 — see ManagePlanClient's own comment for why this page
// exists (Stripe's hosted Portal can't offer a switch-plans menu given how
// checkout builds prices here). Server-gates on tier === "plus" the same
// way every other Plus-only surface in this app does; a free-tier visitor
// has nothing to manage yet, so it sends them to /plus to subscribe first.
export default async function ManagePlanPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const details = await getSubscriptionDetails(session.user.id);
  if (details.tier !== "plus") redirect("/plus");

  const data = await getManagePlanData();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={false} href="/es/plus/manage" />
      <h1 className="text-2xl font-bold tracking-tight">
        Manage your plan <PlusBadge size="lg" />
      </h1>
      <p className="mt-2 text-sm text-muted">
        Switch plans anytime — any price change is prorated automatically by Stripe, so you only ever pay or get
        credited the real difference.
      </p>
      <div className="mt-6">
        <ManagePlanClient data={data} es={false} />
      </div>
    </main>
  );
}
