import Link from "next/link";
import { PlusBadge } from "@/components/PlusBadge";

/**
 * CW-40 — attorney-handoff PDF report, CaseWhy Plus only (see round-4 in
 * CLOUD_CLAUDE.md for the gating decision: it bundles into the same paid
 * tier as CW-35/36/37/38 rather than being free). A plain link is enough
 * here — the browser's session cookie carries auth to the GET route, no
 * client state needed.
 */
export function DownloadReportLink({
  receiptNumber,
  canDownload,
  es,
}: {
  receiptNumber: string;
  canDownload: boolean;
  es: boolean;
}) {
  if (!canDownload) {
    return (
      <p className="mt-1.5 text-xs text-muted">
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
        {es ? "para un reporte PDF descargable para el abogado" : "for a downloadable attorney-handoff PDF report"}
      </p>
    );
  }

  return (
    <a
      href={`/api/report?receiptNumber=${encodeURIComponent(receiptNumber)}`}
      className="mt-1.5 inline-block text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
    >
      {es ? "Descargar reporte para el abogado (PDF)" : "Download attorney report (PDF)"}
    </a>
  );
}
