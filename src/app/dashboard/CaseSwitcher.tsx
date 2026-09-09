import Link from "next/link";
import type { TrackedCase } from "./actions";

/** Only rendered by callers when there's more than one tracked case — CW-36. */
export function CaseSwitcher({
  cases,
  activeReceiptNumber,
  basePath,
}: {
  cases: TrackedCase[];
  activeReceiptNumber?: string;
  basePath: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {cases.map((c) => {
        const active = c.receiptNumber === activeReceiptNumber;
        const pending = c.status === "pending_review";
        return (
          <Link
            key={c.id}
            href={`${basePath}?receipt=${encodeURIComponent(c.receiptNumber)}`}
            className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              active
                ? "bg-brand-500 text-white"
                : pending
                  ? "border border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {c.receiptNumber}
            {pending && <span className="ml-1.5 font-sans text-[10px] uppercase tracking-wide">Pending</span>}
          </Link>
        );
      })}
    </div>
  );
}
