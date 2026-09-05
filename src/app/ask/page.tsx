import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getTrackedReceiptNumber } from "@/app/dashboard/actions";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { CaseChat } from "./CaseChat";

export const dynamic = "force-dynamic";

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

export default async function AskPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
        <p className="mb-8 mt-2 text-muted">
          A conversational way to ask about your case, grounded in CaseWhy&apos;s policy
          knowledge base.
        </p>
        <EmptyState>
          <Link href="/auth/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Sign in
          </Link>{" "}
          and track a case to start asking questions about it.
        </EmptyState>
      </main>
    );
  }

  const receiptNumber = await getTrackedReceiptNumber(session.user.id);
  if (!receiptNumber) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
        <p className="mb-8 mt-2 text-muted">
          A conversational way to ask about your case, grounded in CaseWhy&apos;s policy
          knowledge base.
        </p>
        <EmptyState>
          <Link href="/dashboard" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Track a case on your dashboard
          </Link>{" "}
          first, then come back here to ask about it.
        </EmptyState>
      </main>
    );
  }

  let statusText: string | null = null;
  let formType: string | null = null;
  let errorMessage: string | null = null;
  try {
    const status = await getCaseStatus(receiptNumber);
    statusText = status.statusText;
    formType = status.formType;
  } catch (err) {
    errorMessage =
      err instanceof UscisApiError
        ? "Couldn't reach USCIS's case status service right now. Please try again shortly."
        : "Something went wrong looking up your case.";
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
      <p className="mb-8 mt-2 text-muted">
        A conversational way to ask about your case, grounded in CaseWhy&apos;s policy knowledge
        base.
      </p>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      ) : (
        <>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
            {formType} · {statusText}
          </p>
          <CaseChat />
        </>
      )}
    </main>
  );
}
