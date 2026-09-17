"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { untrackCase, type TrackedCase } from "./actions";
import { CASE_TYPES } from "@/lib/kb/case-type-timeline";

function caseTypeLabel(caseType: string | null, es: boolean): string {
  const found = caseType ? CASE_TYPES.find((c) => c.id === caseType) : undefined;
  if (!found) return es ? "Otro" : "Other";
  return es && found.labelEs ? found.labelEs : found.label;
}

function formatCheckedAt(date: Date | null, es: boolean): string {
  if (!date) return es ? "Aún sin verificar" : "Not yet checked";
  const formatted = date.toLocaleString(es ? "es" : undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return es ? `Revisado ${formatted}` : `Checked ${formatted}`;
}

/**
 * Round 114 follow-up — replaces CaseSwitcher (which only rendered when
 * there was more than one case, and only showed a bare receipt-number
 * pill). Always renders, every case, straight from the database —
 * receipt, type, last known status, last checked — independent of
 * whether today's live refresh succeeds. Found live before the demo: a
 * signed-in user with tracked cases and a failed/unavailable live check
 * previously saw nothing at all about their cases, which read as if
 * they'd lost them.
 */
export function TrackedCasesList({
  cases,
  activeReceiptNumber,
  basePath,
  es,
}: {
  cases: TrackedCase[];
  activeReceiptNumber?: string;
  basePath: string;
  es: boolean;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-6 space-y-2">
      {cases.map((c) => {
        const active = c.receiptNumber === activeReceiptNumber;
        const pending = c.status === "pending_review";
        const confirming = confirmingId === c.id;
        const removing = isPending && removingId === c.id;

        return (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
              active ? "border-brand-500 bg-brand-500/5" : "border-border bg-surface hover:border-border-strong"
            }`}
          >
            <Link
              href={`${basePath}?receipt=${encodeURIComponent(c.receiptNumber)}${es ? "&lang=es" : ""}`}
              className="min-w-0 flex-1"
            >
              <p className="font-mono text-xs text-muted">{c.receiptNumber}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{caseTypeLabel(c.caseType, es)}</span>
                {pending ? (
                  <span className="rounded-full border border-dashed border-amber-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    {es ? "Pendiente" : "Pending"}
                  </span>
                ) : (
                  c.lastStatusText && <span className="text-xs font-medium text-foreground/80">{c.lastStatusText}</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{formatCheckedAt(c.lastCheckedAt, es)}</p>
            </Link>

            {confirming ? (
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="text-muted">{es ? "¿Quitar?" : "Remove?"}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setRemovingId(c.id);
                    startTransition(async () => {
                      await untrackCase(c.id);
                      setConfirmingId(null);
                    });
                  }}
                  className="font-semibold text-red-500 hover:underline disabled:opacity-60"
                >
                  {removing ? (es ? "Eliminando…" : "Removing…") : es ? "Sí" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="font-medium text-muted hover:text-foreground"
                >
                  {es ? "Cancelar" : "Cancel"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(c.id)}
                className="shrink-0 text-xs font-medium text-muted hover:text-red-500 hover:underline"
              >
                {es ? "Dejar de rastrear" : "Stop tracking"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
