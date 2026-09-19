import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { TIER_LIMITS } from "@/lib/billing/tier";
import { getLiveSubscriptionDetail } from "@/lib/billing/live-subscription";
import { PlusBadge } from "@/components/PlusBadge";

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amountCents / 100);
}

function formatDate(date: Date, es: boolean): string {
  return date.toLocaleDateString(es ? "es" : undefined, { year: "numeric", month: "long", day: "numeric" });
}

const INTERVAL_LABELS: Record<string, { en: string; es: string }> = {
  day: { en: "day", es: "día" },
  week: { en: "week", es: "semana" },
  month: { en: "month", es: "mes" },
  year: { en: "year", es: "año" },
};

function intervalLabel(interval: string, es: boolean): string {
  const entry = INTERVAL_LABELS[interval];
  if (!entry) return interval;
  return es ? entry.es : entry.en;
}

/**
 * Round 114 follow-up — Peter, testing Plus: "it doesn't show the tier
 * anywhere." A first Settings section, sourced live from the real
 * subscriptions row + a live Stripe read for the specific plan/price/
 * renewal-date a subscriber actually picked (see live-subscription.ts's
 * own comment for why that can't come from our own DB alone).
 */
export async function PlanSection({ userId, es }: { userId: string; es: boolean }) {
  const db = getDb();
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const tier = row?.tier ?? "free";

  if (tier !== "plus") {
    return (
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{es ? "Plan" : "Plan"}</h2>
        <div className="mt-2 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-foreground">
            {es
              ? `Gratis · ${TIER_LIMITS.free.maxCases} casos rastreados, ${TIER_LIMITS.free.chatQuestionsPerMonth} preguntas de IA al mes`
              : `Free · ${TIER_LIMITS.free.maxCases} tracked cases, ${TIER_LIMITS.free.chatQuestionsPerMonth} AI questions a month`}
          </p>
          <Link
            href="/plus"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {es ? "Actualizar a CaseWhy" : "Upgrade to CaseWhy"} <PlusBadge size="sm" />
          </Link>
        </div>
      </section>
    );
  }

  const live = row?.stripeSubscriptionId ? await getLiveSubscriptionDetail(row.stripeSubscriptionId) : null;

  let statusLine: string;
  if (row?.status === "past_due") {
    statusLine = es ? "pago fallido — actualiza tu tarjeta" : "payment failed — update your card";
  } else if (row?.cancelAtPeriodEnd && row.currentPeriodEnd) {
    statusLine = es ? `termina ${formatDate(row.currentPeriodEnd, es)}` : `ends ${formatDate(row.currentPeriodEnd, es)}`;
  } else if (row?.currentPeriodEnd) {
    statusLine = es ? `renueva ${formatDate(row.currentPeriodEnd, es)}` : `renews ${formatDate(row.currentPeriodEnd, es)}`;
  } else {
    statusLine = "";
  }

  const priceLine = live
    ? `${formatMoney(live.amountCents, live.currency)}/${intervalLabel(live.interval, es)}`
    : null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">{es ? "Plan" : "Plan"}</h2>
      <div className="mt-2 rounded-xl border border-border bg-surface p-5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          {es ? "CaseWhy" : "CaseWhy"} <PlusBadge size="sm" />
          {statusLine && <span className="text-muted">· {statusLine}</span>}
          {priceLine && <span className="text-muted">· {priceLine}</span>}
        </p>
        {row?.status === "past_due" && (
          <p className="mt-1 text-xs text-red-500">
            {es ? "Tu último pago no se procesó." : "Your last payment didn't go through."}
          </p>
        )}
        <Link
          href={es ? "/es/plus/manage" : "/plus/manage"}
          className="mt-3 inline-block rounded-lg border border-border-strong px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand-500"
        >
          {es ? "Administrar plan" : "Manage plan"}
        </Link>
      </div>
    </section>
  );
}
