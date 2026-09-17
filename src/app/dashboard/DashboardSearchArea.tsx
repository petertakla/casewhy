"use client";

// Round 114 follow-up, Finding 4 — converts the dashboard's "Look up
// status" form from a plain <form method="get"> (a native browser
// navigation with zero pending-state signal) into a client-intercepted
// router.push() inside useTransition, so the button/input can actually
// show real pending UI. The result area (everything server-computed
// below the form -- StatusCard, the stale-refresh banner, the empty
// state) is passed in as `children` from the Server Component and swapped
// for a skeleton only while this navigation is in flight; once the new
// page's RSC payload lands, isPending goes false and the real
// server-rendered children (now reflecting the new receipt) render as
// normal -- no client-side data-fetching duplicated here.

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ReceiptNumberInput } from "./ReceiptNumberInput";
import { PendingButton } from "@/components/PendingButton";
import { ResultSkeleton } from "@/components/ResultSkeleton";

export function DashboardSearchArea({
  receiptNumber,
  trackedCaseCount,
  es,
  trackedCasesSlot,
  children,
}: {
  receiptNumber?: string;
  trackedCaseCount: number;
  es: boolean;
  /** Rendered between the form and the pending-swapped result area, always
   * visible regardless of pending state — the account's stable case list
   * doesn't "load" per search the way the result area does. */
  trackedCasesSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const receipt = String(new FormData(e.currentTarget).get("receipt") ?? "").trim();
    if (!receipt) return;
    startTransition(() => {
      router.push(`/dashboard?receipt=${encodeURIComponent(receipt)}${es ? "&lang=es" : ""}`);
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <ReceiptNumberInput defaultValue={receiptNumber} es={es} disabled={isPending} />
          <PendingButton
            type="submit"
            pending={isPending}
            pendingLabel={es ? "Consultando…" : "Looking up…"}
            waitingLabel={es ? "Aún esperando a USCIS…" : "Still waiting on USCIS…"}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {es ? "Consultar estado" : "Look up status"}
          </PendingButton>
        </div>
        <p className="text-xs text-muted">
          {trackedCaseCount > 0
            ? es
              ? 'Busca un número de recibo, luego pulsa "Rastrear este caso" en el resultado para guardarlo.'
              : 'Look up a receipt number, then click "Track this case" on the result to save it.'
            : es
              ? 'Busca un número de recibo para ver su estado — luego pulsa "Rastrear este caso" para guardarlo.'
              : 'Look up a receipt number to see its status — then click "Track this case" to save it.'}
        </p>
      </form>
      {trackedCasesSlot}
      {isPending ? <ResultSkeleton /> : children}
    </>
  );
}
