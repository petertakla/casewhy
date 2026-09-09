import { notFound } from "next/navigation";
import { ATTORNEY_DIRECTORY } from "@/lib/attorneys/directory";
import { BackLink } from "@/components/BackLink";

// New task, same day as round 29/30/31 — every directory entry across all
// entity types gets its own permalink (decided Sep 8, applies uniformly).
// The attorney directory is still empty pending real self-enrolled
// attorneys (round 27), so this route currently only 404s, but it's built
// now rather than left as a follow-up once real entries land.
export default async function AttorneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attorney = ATTORNEY_DIRECTORY.find((a) => a.id === id);
  if (!attorney) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/attorneys" label="All attorneys" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{attorney.name}</h1>
      <p className="mt-1 text-muted">{attorney.firm}</p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">States licensed</p>
          <p className="mt-1">{attorney.statesLicensed.join(", ")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Practice focus</p>
          <p className="mt-1">{attorney.practiceFocus.join(", ")}</p>
        </div>
      </div>

      <a
        href={attorney.contactMethod.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {attorney.contactMethod.label}
      </a>

      <p className="mt-6 text-xs text-muted">
        This is an informational listing, not an endorsement or a referral service. Always confirm
        current bar standing yourself before hiring anyone.
      </p>
    </main>
  );
}
