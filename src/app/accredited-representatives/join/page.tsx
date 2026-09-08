import { ApplicationForm } from "./ApplicationForm";

export default function RepresentativeJoinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Apply to be listed</h1>
      <p className="mt-2 text-sm text-muted">
        For BIA-accredited representatives — non-lawyers authorized by the DOJ to practice
        immigration law, typically at a nonprofit organization. This is an informational listing,
        not an endorsement: every application is reviewed against the DOJ&apos;s own
        Recognition &amp; Accreditation roster before anyone is added.
      </p>
      <p className="mt-2 text-xs text-muted">
        Free to join, always — no fee to be listed.
      </p>
      <div className="mt-8">
        <ApplicationForm />
      </div>
    </main>
  );
}
