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
        return (
          <Link
            key={c.id}
            href={`${basePath}?receipt=${encodeURIComponent(c.receiptNumber)}`}
            className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              active
                ? "bg-brand-500 text-white"
                : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {c.receiptNumber}
          </Link>
        );
      })}
    </div>
  );
}
