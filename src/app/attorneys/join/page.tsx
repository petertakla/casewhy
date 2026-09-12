import type { Metadata } from "next";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = {
  title: "List Your Firm — Free for Immigration Attorneys | CaseWhy",
  description:
    "Immigration attorneys can apply to be listed in CaseWhy's free directory — no cost to join, reviewed against your state bar's public record.",
};

export default function AttorneyJoinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Apply to be listed</h1>
      <p className="mt-2 text-sm text-muted">
        For licensed immigration attorneys. This is an informational listing, not an endorsement:
        every application is reviewed against your state bar&apos;s public lookup tool before
        anyone is added.
      </p>
      <p className="mt-2 text-xs text-muted">
        Free to join, always — no fee to be a founding partner.
      </p>
      <div className="mt-8">
        <ApplicationForm />
      </div>
    </main>
  );
}
