"use client";

// Round 115, Part 1 — the in-app plan-switch flow. Portal config alone
// can't do this (see startCheckout's own comment: checkout builds an
// ad-hoc price_data per session, so there's no pre-registered "Monthly/
// 6-Month/Annual" Price set for Stripe's own Portal to offer as a
// switch menu) -- this page and its two server actions (previewPlanSwitch,
// switchPlan, both in ../actions.ts) are the real fix. Cancellation
// itself still opens Stripe's own hosted Portal (still the right tool for
// payment-method updates and invoice history), just no longer the only
// way to change plans.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PendingButton } from "@/components/PendingButton";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { openBillingPortal, previewPlanSwitch, switchPlan, downgradeToFreeAtPeriodEnd } from "../actions";
import type { ManagePlanData, PlanSwitchPreview } from "../actions";
import type { PlanId } from "@/lib/billing/pricing";

const PLAN_NAME: Record<PlanId, { en: string; es: string }> = {
  plus_monthly: { en: "Monthly", es: "Mensual" },
  plus_6month: { en: "6-Month", es: "Cada 6 meses" },
  plus_annual: { en: "Annual", es: "Anual" },
};

const INTERVAL_LABEL: Record<string, { en: string; es: string }> = {
  month: { en: "month", es: "mes" },
  year: { en: "year", es: "año" },
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(date: Date, es: boolean): string {
  return date.toLocaleDateString(es ? "es" : undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function ManagePlanClient({ data, es }: { data: ManagePlanData; es: boolean }) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [preview, setPreview] = useState<PlanSwitchPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [switching, startSwitch] = useTransition();
  const [confirmingDowngrade, setConfirmingDowngrade] = useState(false);
  const [downgrading, startDowngrade] = useTransition();

  function handlePick(planId: PlanId) {
    setError(null);
    setSelectedPlan(planId);
    setPreview(null);
    startPreview(async () => {
      try {
        const result = await previewPlanSwitch(planId);
        setPreview(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSelectedPlan(null);
      }
    });
  }

  function handleConfirmSwitch() {
    if (!selectedPlan) return;
    setError(null);
    startSwitch(async () => {
      try {
        await switchPlan(selectedPlan);
        setSelectedPlan(null);
        setPreview(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleDowngrade() {
    setError(null);
    startDowngrade(async () => {
      try {
        await downgradeToFreeAtPeriodEnd();
        setConfirmingDowngrade(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {data.cancelAtPeriodEnd && data.currentPeriodEnd && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          {es
            ? `Tu suscripción está programada para cancelarse el ${formatDate(data.currentPeriodEnd, es)}. Mantendrás acceso completo hasta entonces.`
            : `Your subscription is set to cancel on ${formatDate(data.currentPeriodEnd, es)}. You'll keep full access until then.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.plans.map((plan) => {
          const isCurrent = plan.planId === data.currentPlanId;
          const isSelected = plan.planId === selectedPlan;
          return (
            <button
              key={plan.planId}
              type="button"
              disabled={isCurrent || previewing || switching}
              onClick={() => handlePick(plan.planId)}
              className={`flex flex-col rounded-xl border p-5 text-left transition-colors disabled:cursor-not-allowed ${
                isSelected
                  ? "border-brand-500 bg-brand-500/5"
                  : "border-border bg-surface hover:border-brand-500/50"
              }`}
            >
              <p className="flex items-center justify-between text-sm font-semibold text-muted">
                {es ? PLAN_NAME[plan.planId].es : PLAN_NAME[plan.planId].en}
                {isCurrent && (
                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                    {es ? "tu plan" : "current plan"}
                  </span>
                )}
              </p>
              <p className="mt-1">
                <span className="font-mono text-2xl font-bold text-foreground">
                  {formatMoney(plan.priceCents, "usd")}
                </span>{" "}
                <span className="text-sm text-muted">
                  / {es ? INTERVAL_LABEL[plan.billingInterval]?.es ?? plan.billingInterval : INTERVAL_LABEL[plan.billingInterval]?.en ?? plan.billingInterval}
                  {plan.intervalCount > 1 ? ` × ${plan.intervalCount}` : ""}
                </span>
              </p>
            </button>
          );
        })}
      </div>

      {selectedPlan && (previewing || preview) && (
        <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          {previewing ? (
            <p className="text-sm text-muted">{es ? "Calculando el prorrateo…" : "Calculating proration…"}</p>
          ) : preview ? (
            <>
              <p className="text-sm font-medium text-foreground">
                {preview.amountDueCents > 0
                  ? es
                    ? `Se te cobrará ${formatMoney(preview.amountDueCents, preview.currency)} hoy para cambiar a ${PLAN_NAME[selectedPlan].es}.`
                    : `You'll be charged ${formatMoney(preview.amountDueCents, preview.currency)} today to switch to ${PLAN_NAME[selectedPlan].en}.`
                  : preview.amountDueCents < 0
                    ? es
                      ? `Recibirás un crédito de ${formatMoney(Math.abs(preview.amountDueCents), preview.currency)} al cambiar a ${PLAN_NAME[selectedPlan].es}.`
                      : `You'll get a ${formatMoney(Math.abs(preview.amountDueCents), preview.currency)} credit switching to ${PLAN_NAME[selectedPlan].en}.`
                    : es
                      ? `No hay cambio en el monto de hoy al cambiar a ${PLAN_NAME[selectedPlan].es}.`
                      : `No change to today's amount switching to ${PLAN_NAME[selectedPlan].en}.`}
              </p>
              <div className="mt-3 flex gap-2">
                <PendingButton
                  type="button"
                  pending={switching}
                  pendingLabel={es ? "Cambiando…" : "Switching…"}
                  onClick={handleConfirmSwitch}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {es ? "Confirmar cambio" : "Confirm switch"}
                </PendingButton>
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => {
                    setSelectedPlan(null);
                    setPreview(null);
                  }}
                  className="rounded-lg border border-border-strong px-4 py-2 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {es ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <div className="mt-8 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "Otras opciones" : "Other options"}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <form action={openBillingPortal}>
            <FormSubmitButton
              pendingLabel={es ? "Abriendo facturación…" : "Opening billing…"}
              className="rounded-lg border border-border-strong px-4 py-2 text-xs font-semibold text-foreground hover:border-brand-500"
            >
              {es ? "Actualizar método de pago" : "Update payment method"}
            </FormSubmitButton>
          </form>

          {!data.cancelAtPeriodEnd &&
            (confirmingDowngrade ? (
              <span className="inline-flex items-center gap-2 text-xs">
                <span className="text-muted">
                  {es ? "¿Seguro? Mantendrás Plus hasta el final del período." : "Sure? You'll keep Plus through the end of your period."}
                </span>
                <PendingButton
                  type="button"
                  pending={downgrading}
                  pendingLabel={es ? "Procesando…" : "Processing…"}
                  onClick={handleDowngrade}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-70 dark:text-red-400"
                >
                  {es ? "Sí, bajar a Gratis" : "Yes, downgrade to Free"}
                </PendingButton>
                <button
                  type="button"
                  onClick={() => setConfirmingDowngrade(false)}
                  className="text-muted hover:underline"
                >
                  {es ? "No" : "No"}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDowngrade(true)}
                className="text-xs font-semibold text-muted hover:text-red-600 hover:underline dark:hover:text-red-400"
              >
                {es ? "Bajar a Gratis / Cancelar" : "Downgrade to Free / Cancel"}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
