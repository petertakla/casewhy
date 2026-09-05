import {
  FAMILY_FINAL_ACTION,
  EMPLOYMENT_FINAL_ACTION,
  VISA_BULLETIN_MONTH,
  VISA_BULLETIN_SOURCE_URL,
  bulletinDateLabel,
  type BulletinRow,
} from "@/lib/kb/visa-bulletin";

function BulletinTable({ rows }: { rows: BulletinRow[] }) {
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
          {rows.map((row) => (
            <tr key={row.category} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <span className="font-semibold">{row.category}</span>
                <span className="ml-2 text-muted">{row.label}</span>
              </td>
              <td className="px-4 py-3 font-mono">{bulletinDateLabel(row.allOther)}</td>
              <td className="px-4 py-3 font-mono">{row.china ? bulletinDateLabel(row.china) : "—"}</td>
              <td className="px-4 py-3 font-mono">{row.india ? bulletinDateLabel(row.india) : "—"}</td>
              <td className="px-4 py-3 font-mono">{row.mexico ? bulletinDateLabel(row.mexico) : "—"}</td>
              <td className="px-4 py-3 font-mono">{row.philippines ? bulletinDateLabel(row.philippines) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VisaBulletinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Visa bulletin</h1>
      <p className="mb-2 mt-2 text-muted">
        Final Action Dates — the chart that determines when a family- or employment-based green
        card can actually be issued or adjustment of status approved, once a petition is
        approved and a priority date is waiting for a visa to become available.
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

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
        Family-sponsored preferences
      </h2>
      <BulletinTable rows={FAMILY_FINAL_ACTION} />

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-muted">
        Employment-based preferences
      </h2>
      <BulletinTable rows={EMPLOYMENT_FINAL_ACTION} />

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
