"use client";

// Round 41 — shared "report incorrect information" trigger + inline form,
// used on every listing card and permalink page across all three live Get
// Help entity types (and every future one, per
// partner-marketing-domain-concept.md's standing template). Deliberately
// an inline expand rather than a modal — no dialog/modal component exists
// anywhere else in this codebase, and a plain expand needs no new
// dependency for what's a small, secondary action.
//
// The listing itself (entityType/entityId/entityName) is passed in as
// props, not re-entered by the reporter — the task's own explicit
// requirement, since making someone retype which listing they're reporting
// would be a real friction point for what's meant to be a quick flag.

import { useState, useTransition } from "react";
import { submitListingReport } from "@/app/actions";
import type { ReportableEntityType } from "@/lib/reports/report";

const inputClass =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500";

// Round 79 — optional label overrides so casewhy.com/es's directory pages
// can reuse this component as-is instead of forking it. Every field
// defaults to the existing English copy, so no existing caller changes.
export interface ReportListingLinkLabels {
  trigger?: string;
  success?: string;
  whatsWrong?: string;
  whatsWrongPlaceholder?: string;
  email?: string;
  sending?: string;
  send?: string;
  cancel?: string;
  defaultError?: string;
}

export function ReportListingLink({
  entityType,
  entityId,
  entityName,
  labels,
}: {
  entityType: ReportableEntityType;
  entityId: string;
  entityName: string;
  labels?: ReportListingLinkLabels;
}) {
  const t = {
    trigger: labels?.trigger ?? "See something wrong with this listing? Report it",
    success: labels?.success ?? "Thanks — we'll take a look.",
    whatsWrong: labels?.whatsWrong ?? "What's wrong with this listing?",
    whatsWrongPlaceholder:
      labels?.whatsWrongPlaceholder ??
      "e.g. phone number is disconnected, no longer at this address, organization closed",
    email: labels?.email ?? "Your email (optional, if you'd like a reply)",
    sending: labels?.sending ?? "Sending…",
    send: labels?.send ?? "Send report",
    cancel: labels?.cancel ?? "Cancel",
    defaultError: labels?.defaultError ?? "Something went wrong. Please try again.",
  };
  const [open, setOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await submitListingReport({
        entityType,
        entityId,
        entityName,
        reportText,
        reporterEmail,
        website,
      });
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(result.error ?? t.defaultError);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-xs text-muted underline decoration-dotted hover:text-foreground"
      >
        {t.trigger}
      </button>
    );
  }

  if (status === "success") {
    return <p className="text-xs text-muted">{t.success}</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="space-y-2 rounded-lg border border-border bg-surface-2 p-3"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground">
          {t.whatsWrong}
        </span>
        <textarea
          required
          rows={2}
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder={t.whatsWrongPlaceholder}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground">
          {t.email}
        </span>
        <input
          type="email"
          value={reporterEmail}
          onChange={(e) => setReporterEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      {/* Honeypot — hidden from real visitors via CSS. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
          className="text-xs text-muted hover:text-foreground"
        >
          {t.cancel}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
