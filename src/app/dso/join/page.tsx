import type { Metadata } from "next";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Add or Update a DSO Contact | CaseWhy",
  description:
    "Designated School Officials can submit or update their school's contact info in CaseWhy's free directory.",
};

export default function DsoJoinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Add or update a DSO contact</h1>
      <p className="mt-2 text-sm text-muted">
        We seed this directory from DHS&apos;s own SEVP-certified school list, which doesn&apos;t
        include a Designated School Official&apos;s name, phone, or email — there&apos;s no federal
        registry of that. If you&apos;re a DSO (or represent one), submit your school&apos;s real
        contact info here and we&apos;ll add it to the listing after review.
      </p>
      <p className="mt-2 text-xs text-muted">Free, always — no fee to be listed.</p>
      <div className="mt-8">
        <ApplicationForm />
      </div>
    </main>
  );
}
