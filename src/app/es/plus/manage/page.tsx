import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site/metadata";
import { auth } from "@/lib/auth/server";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";
import { getManagePlanData } from "@/app/plus/actions";
import { ManagePlanClient } from "@/app/plus/manage/ManagePlanClient";

export const metadata: Metadata = pageMetadata("/es/plus/manage", {
  title: "Administra tu plan | CaseWhy Plus",
  description: "Cambia entre planes de CaseWhy Plus, actualiza tu método de pago o cancela.",
  locale: "es",
});

// Round 115, Part 1 — Spanish route for /plus/manage. Reuses the real
// server actions and ManagePlanClient (business logic + UI) as-is, same
// "shared logic, translated copy via an es prop" pattern PlanSection.tsx
// and EscalationToolkit.tsx already use, not a duplicated component.
export default async function ManagePlanPageEs() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in?lang=es");

  const details = await getSubscriptionDetails(session.user.id);
  if (details.tier !== "plus") redirect("/es/plus");

  const data = await getManagePlanData();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={true} href="/plus/manage" />
      <h1 className="text-2xl font-bold tracking-tight">
        Administra tu plan <PlusBadge size="lg" />
      </h1>
      <p className="mt-2 text-sm text-muted">
        Cambia de plan cuando quieras — cualquier cambio de precio se prorratea automáticamente con Stripe, así que
        solo pagas o recibes crédito por la diferencia real.
      </p>
      <div className="mt-6">
        <ManagePlanClient data={data} es={true} />
      </div>
    </main>
  );
}
