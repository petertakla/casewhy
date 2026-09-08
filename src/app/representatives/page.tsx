import Link from "next/link";
import {
  REPRESENTATIVE_DIRECTORY,
  REPRESENTATIVE_DIRECTORY_DISCLAIMER,
} from "@/lib/representatives/directory";

export default function RepresentativesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Find an accredited representative</h1>
      <p className="mb-2 mt-2 text-muted">
        A hand-curated list of DOJ-accredited representatives — non-lawyers authorized to practice
        immigration law, typically at nonprofit organizations.
      </p>
      <p className="mb-8 text-xs text-muted">{REPRESENTATIVE_DIRECTORY_DISCLAIMER}</p>

      {REPRESENTATIVE_DIRECTORY.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            We&apos;re still building this list out — check back soon. In the meantime, the
            Department of Justice publishes its own{" "}
            <a
              href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              Recognized Organizations and Accredited Representatives roster
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {REPRESENTATIVE_DIRECTORY.map((rep) => (
            <div key={rep.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{rep.name}</p>
                <p className="text-xs text-muted">{rep.statesServed.join(", ")}</p>
              </div>
              <p className="text-sm text-muted">{rep.organization}</p>
              <p className="mt-1 text-xs text-muted">{rep.accreditationDetails}</p>
              <p className="mt-2 text-xs text-muted">{rep.practiceFocus.join(" · ")}</p>
              <a
                href={rep.contactMethod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                {rep.contactMethod.label}
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-muted">
        Represent a nonprofit with DOJ-accredited staff?{" "}
        <Link href="/representatives/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Apply to be listed
        </Link>
        .
      </p>
    </main>
  );
}
