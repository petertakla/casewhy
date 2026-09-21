"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { trackCase, untrackCase } from "./actions";
import { PlusBadge } from "@/components/PlusBadge";
import { PendingButton } from "@/components/PendingButton";
import { CASE_TYPES } from "@/lib/kb/case-type-timeline";

export function TrackCaseButton({
  receiptNumber,
  trackedCaseId,
  alreadyTracked,
  atCap,
  maxCases,
  plusMaxCases,
  willQueueForReview = false,
  isPlusHardCeiling = false,
  es,
}: {
  receiptNumber: string;
  /** Present when alreadyTracked — the row id, needed to untrack. */
  trackedCaseId?: string;
  alreadyTracked: boolean;
  atCap: boolean;
  maxCases: number;
  /** CaseWhy Plus's own cap — shown in the free-tier "upgrade" message. */
  plusMaxCases: number;
  /** Round 46 — true when adding another case will land as pending_review
   * (Plus, past the 10-case auto-approved band) rather than active. */
  willQueueForReview?: boolean;
  /** Round 46 — true when atCap is Plus's 25-case hard ceiling rather than
   * a flat-tier cap — swaps the message to "contact us" instead of
   * "upgrade to Plus," since the account is already on Plus. */
  isPlusHardCeiling?: boolean;
  es: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Round 114 follow-up — defaults to "other" so the button works with a
  // single click (found live before the demo: requiring an explicit
  // selection first made "track this case" a two-step action that wasn't
  // obvious from the button alone). The type can still be refined via the
  // select before or after saving.
  const [caseType, setCaseType] = useState("other");
  const selected = CASE_TYPES.find((c) => c.id === caseType);

  // Round 22 — the list grew past a flat dropdown (9 real types + "Other"),
  // grouped into optgroups. Grouping is derived here, in array order, rather
  // than duplicated as a separate data structure.
  const groupedOptions: { group: string; options: typeof CASE_TYPES }[] = [];
  const ungrouped: typeof CASE_TYPES = [];
  for (const option of CASE_TYPES) {
    if (!option.group) {
      ungrouped.push(option);
      continue;
    }
    let bucket = groupedOptions.find((g) => g.group === option.group);
    if (!bucket) {
      bucket = { group: option.group, options: [] };
      groupedOptions.push(bucket);
    }
    bucket.options.push(option);
  }

  if (alreadyTracked && trackedCaseId) {
    return (
      <div className="flex items-center gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-500">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {es ? "Rastreando · revisado a diario" : "Tracking · checked daily"}
        </p>
        <PendingButton
          pending={isPending}
          pendingLabel={es ? "Eliminando…" : "Removing…"}
          onClick={() => startTransition(async () => {
            await untrackCase(trackedCaseId);
          })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          spinnerClassName="h-3 w-3"
        >
          {es ? "Dejar de rastrear" : "Stop tracking"}
        </PendingButton>
      </div>
    );
  }

  if (atCap && isPlusHardCeiling) {
    return (
      <p className="text-xs text-muted">
        {es ? (
          <>
            Estás rastreando el máximo de {maxCases} casos que CaseWhy Plus admite. ¿Necesitas rastrear
            más?{" "}
            <a href="mailto:hello@casewhy.com" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Contáctanos
            </a>
            .
          </>
        ) : (
          <>
            You&apos;re tracking the maximum of {maxCases} cases CaseWhy Plus supports. Need to track
            more?{" "}
            <a href="mailto:hello@casewhy.com" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Contact us
            </a>
            .
          </>
        )}
      </p>
    );
  }

  if (atCap) {
    return (
      <p className="text-xs text-muted">
        {es ? (
          <>
            Tu cuenta gratuita ya usó sus {maxCases} búsquedas de por vida — rastrear o
            consultar un número de recibo, ambas cuentan, y dejar de rastrear uno no libera un
            lugar nuevo.{" "}
            <Link href="/plus" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Actualiza a CaseWhy <PlusBadge size="sm" />
            </Link>{" "}
            para hasta {plusMaxCases} casos.
          </>
        ) : (
          <>
            Your free account has already used its {maxCases} lifetime lookups — tracking or
            checking a receipt number&apos;s status both count, and untracking one doesn&apos;t
            free up a new slot.{" "}
            <Link href="/plus" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Upgrade to CaseWhy <PlusBadge size="sm" />
            </Link>{" "}
            for up to {plusMaxCases} cases.
          </>
        )}
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted">
        {es
          ? "No rastreado todavía — rastréalo para recibir una alerta cuando cambie el estado."
          : "Not tracked yet — track it to get an alert when the status changes."}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <PendingButton
          pending={isPending}
          pendingLabel={es ? "Guardando…" : "Saving…"}
          onClick={() => startTransition(async () => {
            setError(null);
            try {
              await trackCase(receiptNumber, caseType);
            } catch (err) {
              setError(err instanceof Error ? err.message : es ? "Algo salió mal." : "Something went wrong.");
            }
          })}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {es ? "Rastrear este caso" : "Track this case"}
        </PendingButton>
        <select
          id="track-case-type"
          value={caseType}
          onChange={(e) => setCaseType(e.target.value)}
          aria-label={es ? "¿Qué tipo de caso es este?" : "What kind of case is this?"}
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
        >
          {groupedOptions.map((g) => (
            <optgroup key={g.group} label={(es && g.options[0]?.groupEs) || g.group}>
              {g.options.map((c) => (
                <option key={c.id} value={c.id}>
                  {es && c.labelEs ? c.labelEs : c.label}
                </option>
              ))}
            </optgroup>
          ))}
          {ungrouped.map((c) => (
            <option key={c.id} value={c.id}>
              {es && c.labelEs ? c.labelEs : c.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-muted">
        {es
          ? "Ajusta el tipo de formulario para una respuesta de IA más detallada y específica."
          : "Adjust the form type for a more detailed, form-specific AI response."}
      </p>
      {selected && <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted">{selected.timelineBlurb}</p>}
      {willQueueForReview && (
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-amber-600 dark:text-amber-400">
          {es ? (
            <>
              Rastrear más de 10 casos necesita una revisión rápida — te enviaremos un correo dentro de 1 día
              hábil. Este se mostrará como &quot;Revisión pendiente&quot; hasta entonces; tus casos
              existentes siguen actualizándose normalmente.
            </>
          ) : (
            <>
              Tracking more than 10 cases needs a quick check — we&apos;ll email you within 1 business
              day. This one will show as &quot;Pending review&quot; until then; your existing cases
              keep updating normally.
            </>
          )}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
