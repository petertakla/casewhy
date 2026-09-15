"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { checkCaseNow } from "./actions";
import { PlusBadge } from "@/components/PlusBadge";

function formatCheckedAt(date: Date | null, es: boolean): string {
  if (!date) return es ? "Nunca revisado" : "Never checked";
  const formatted = date.toLocaleString(es ? "es" : undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return es ? `Revisado ${formatted}` : `Checked ${formatted}`;
}

/**
 * CW-37 — on-demand status check, CaseWhy Plus only. Free accounts stay on
 * the once-daily cron (src/app/api/cron/check-status). `canCheckNow` gates
 * the button itself; `lastCheckedAt` is shown either way so a free user
 * still sees when the daily cron last ran for this case.
 */
export function CheckNowButton({
  trackedCaseId,
  lastCheckedAt,
  canCheckNow,
  es,
}: {
  trackedCaseId: string;
  lastCheckedAt: Date | null;
  canCheckNow: boolean;
  es: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState(lastCheckedAt);

  if (!canCheckNow) {
    return (
      <p className="mt-1.5 text-xs text-muted">
        {formatCheckedAt(checkedAt, es)} ·{" "}
        <Link href="/plus" className="text-brand-600 hover:underline dark:text-brand-400">
          {es ? (
            <>
              Actualiza a CaseWhy <PlusBadge size="sm" />
            </>
          ) : (
            <>
              Upgrade to CaseWhy <PlusBadge size="sm" />
            </>
          )}
        </Link>{" "}
        {es ? "para revisar bajo demanda" : "to check on demand"}
      </p>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
      <span>{formatCheckedAt(checkedAt, es)}</span>
      <span>·</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await checkCaseNow(trackedCaseId);
              setCheckedAt(new Date());
            } catch (err) {
              setError(err instanceof Error ? err.message : es ? "Algo salió mal." : "Something went wrong.");
            }
          })
        }
        className="font-semibold text-brand-600 hover:underline disabled:opacity-60 dark:text-brand-400"
      >
        {isPending ? (es ? "Revisando…" : "Checking…") : es ? "Revisar ahora" : "Check now"}
      </button>
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
