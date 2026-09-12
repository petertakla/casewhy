import type { Metadata } from "next";
import {
  FAMILY_FINAL_ACTION,
  EMPLOYMENT_FINAL_ACTION,
  VISA_BULLETIN_MONTH,
  VISA_BULLETIN_SOURCE_URL,
  VISA_BULLETIN_PREVIOUS_MONTH,
  bulletinDateLabel,
  computeMovement,
  type BulletinRow,
  type BulletinMovement,
} from "@/lib/kb/visa-bulletin";
import { ShareButton } from "@/components/ShareButton";

export const metadata: Metadata = {
  title: "Visa Bulletin — Final Action Dates | CaseWhy",
  description:
    "Track family- and employment-based visa bulletin Final Action Dates each month, with movement indicators since the prior bulletin.",
};

function MovementBadge({ movement }: { movement: BulletinMovement | null }) {
  if (!movement) return null;
  if (movement === "forward") {
    return <span className="ml-1.5 inline-block rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400" title="Moved forward since last month">▲</span>;
  }
  if (movement === "retrogressed") {
    return <span className="ml-1.5 inline-block rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400" title="Retrogressed since last month">▼</span>;
  }
  return <span className="ml-1.5 inline-block rounded-full bg-border px-1.5 py-0.5 text-[10px] font-semibold text-muted" title="No change since last month">—</span>;
}

function BulletinTable({ rows, previousRows }: { rows: BulletinRow[]; previousRows?: BulletinRow[] }) {
  const previousFor = (category: string) => previousRows?.find((r) => r.category === category);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">All other countries</th>
            <th className="px-4 py-3 font-semibold">China</th>
            <th className="px-4 py-3 font-semibold">India</th>
            <th className="px-4 py-3 font-semibold">Mexico</th>
            <th className="px-4 py-3 font-semibold">Philippines</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const prev = previousFor(row.category);
            return (
              <tr key={row.category} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold">{row.category}</span>
                  <span className="ml-2 text-muted">{row.label}</span>
                </td>
                <td className="px-4 py-3 font-mono">
                  {bulletinDateLabel(row.allOther)}
                  <MovementBadge movement={computeMovement(row.allOther, prev?.allOther)} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.china ? bulletinDateLabel(row.china) : "—"}
                  <MovementBadge movement={computeMovement(row.china, prev?.china)} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.india ? bulletinDateLabel(row.india) : "—"}
                  <MovementBadge movement={computeMovement(row.india, prev?.india)} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.mexico ? bulletinDateLabel(row.mexico) : "—"}
                  <MovementBadge movement={computeMovement(row.mexico, prev?.mexico)} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.philippines ? bulletinDateLabel(row.philippines) : "—"}
                  <MovementBadge movement={computeMovement(row.philippines, prev?.philippines)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Round 73 — direct-answer block + FAQPage schema, so the page's own
// existing "what does current mean" explanation (previously only at the
// very bottom) is extractable near the top too. See
// round73-seo-geo-foundation-task.md item 3-4.
const CURRENT_MEANS_ANSWER =
  "\"Current\" means visas are available to all qualified applicants in that category regardless of priority date. A listed date means only applicants with a priority date earlier than that date currently have a visa available.";

function summarizeMovement(rows: BulletinRow[], previousRows?: BulletinRow[]): string {
  if (!previousRows) return "";
  let forward = 0;
  let retrogressed = 0;
  for (const row of rows) {
    const prev = previousRows.find((r) => r.category === row.category);
    if (!prev) continue;
    (["allOther", "china", "india", "mexico", "philippines"] as const).forEach((col) => {
      const movement = computeMovement(row[col], prev[col]);
      if (movement === "forward") forward++;
      if (movement === "retrogressed") retrogressed++;
    });
  }
  if (forward === 0 && retrogressed === 0) return "No categories moved since last month's bulletin.";
  const parts: string[] = [];
  if (forward > 0) parts.push(`${forward} moved forward`);
  if (retrogressed > 0) parts.push(`${retrogressed} retrogressed`);
  return `${parts.join(", ")} since last month's bulletin.`;
}

export default function VisaBulletinPage() {
  const movementSummary = VISA_BULLETIN_PREVIOUS_MONTH
    ? summarizeMovement(
        [...FAMILY_FINAL_ACTION, ...EMPLOYMENT_FINAL_ACTION],
        [...(VISA_BULLETIN_PREVIOUS_MONTH.family ?? []), ...(VISA_BULLETIN_PREVIOUS_MONTH.employment ?? [])]
      )
    : "";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does 'Current' mean on the visa bulletin?",
        acceptedAnswer: { "@type": "Answer", text: CURRENT_MEANS_ANSWER },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-2xl font-bold tracking-tight">Visa bulletin</h1>
      <p className="mb-2 mt-2 text-muted">
        Final Action Dates — the chart that determines when a family- or employment-based green
        card can actually be issued or adjustment of status approved, once a petition is
        approved and a priority date is waiting for a visa to become available.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {CURRENT_MEANS_ANSWER} {movementSummary}
      </p>
      <p className="mb-8 text-xs text-muted">
        {VISA_BULLETIN_MONTH} —{" "}
        <a
          href={VISA_BULLETIN_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          view the official Department of State bulletin
        </a>
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/visa-bulletin"
          title="CaseWhy — Visa bulletin"
          text="Track visa bulletin movement for free with CaseWhy."
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
        Family-sponsored preferences
      </h2>
      <BulletinTable rows={FAMILY_FINAL_ACTION} previousRows={VISA_BULLETIN_PREVIOUS_MONTH?.family} />

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-muted">
        Employment-based preferences
      </h2>
      <BulletinTable rows={EMPLOYMENT_FINAL_ACTION} previousRows={VISA_BULLETIN_PREVIOUS_MONTH?.employment} />

      {!VISA_BULLETIN_PREVIOUS_MONTH && (
        <p className="mt-4 text-xs text-muted">
          Month-over-month movement badges will start appearing once next month&apos;s bulletin is
          added alongside this one.
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        &quot;Current&quot; means visas are available to all qualified applicants in that category
        regardless of priority date. A listed date means only applicants with a priority date
        earlier than that date currently have a visa available. This table is refreshed monthly —
        always confirm against the official bulletin above before relying on it for a filing
        decision.
      </p>
    </main>
  );
}
