import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { startCheckout, openBillingPortal } from "./actions";

function FeatureRow({ title, free, plus }: { title: string; free: string; plus: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border py-4 text-sm last:border-b-0 sm:grid-cols-[1fr_140px_140px]">
      <span className="font-medium text-foreground/90">{title}</span>
      <span className="text-center text-muted">{free}</span>
      <span className="text-center font-semibold text-brand-600 dark:text-brand-400">{plus}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <p className="font-semibold">{q}</p>
      <p className="mt-1.5 text-sm text-muted">{a}</p>
    </div>
  );
}

export default async function PlusPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const { data: session } = await auth.getSession();
  const details = session?.user ? await getSubscriptionDetails(session.user.id) : null;
  const isPlus = details?.tier === "plus";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      {checkout === "success" && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          You&apos;re subscribed to CaseWhy Plus. It may take a few seconds for every feature to unlock.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="mb-6 rounded-xl border border-border-strong bg-surface-2 p-4 text-sm text-muted">
          Checkout was cancelled — no charge was made.
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight">CaseWhy Plus</h1>
      <p className="mb-2 mt-2 text-lg text-muted">
        Everything CaseWhy does, without the limits — for you and your whole family.
      </p>
      <p className="text-sm text-muted">
        <span className="font-mono text-xl font-bold text-foreground">$9.99</span> / month, billed
        monthly, cancel anytime.
      </p>

      {isPlus && details?.cancelAtPeriodEnd && details.currentPeriodEnd && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Your subscription is set to cancel on {details.currentPeriodEnd.toLocaleDateString()}.
          You&apos;ll keep full access until then.
        </div>
      )}
      {isPlus && details?.status === "past_due" && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          Your last payment didn&apos;t go through. Update your payment method to keep your
          subscription active.
        </div>
      )}

      <div className="mt-6">
        {!session?.user ? (
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Sign in to subscribe
          </Link>
        ) : isPlus ? (
          <form action={openBillingPortal}>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Manage subscription
            </button>
          </form>
        ) : (
          <form action={startCheckout}>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Subscribe to CaseWhy Plus
            </button>
          </form>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border-strong pb-3 text-xs font-semibold uppercase tracking-widest text-muted sm:grid-cols-[1fr_140px_140px]">
          <span></span>
          <span className="text-center">Free</span>
          <span className="text-center text-brand-600 dark:text-brand-400">Plus</span>
        </div>
        <FeatureRow title="AI chat about your case" free="10 / month" plus="Unlimited" />
        <FeatureRow title="Tracked cases (family)" free="1" plus="Up to 5" />
        <FeatureRow title="On-demand status checks" free="—" plus="Included" />
        <FeatureRow title="Secure document vault" free="—" plus="Included" />
        <FeatureRow title="Stalled-case alert" free="Included" plus="Included" />
        <FeatureRow title="Representative lookup" free="—" plus="Included" />
        <FeatureRow title="Escalation letter drafting" free="—" plus="Included" />
        <FeatureRow title="Attorney-handoff PDF report" free="—" plus="Included" />
      </div>
      <p className="mt-2 text-xs text-muted">
        The stalled-case alert itself is always free — only the representative lookup and letter
        drafting that follow it are part of CaseWhy Plus.
      </p>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Questions</h2>
        <div className="mt-3">
          <FaqItem
            q="Can I cancel anytime?"
            a="Yes — manage your subscription anytime from this page. Canceling keeps your Plus access through the end of the period you've already paid for, then reverts to the free tier. Nothing you've tracked or uploaded is deleted."
          />
          <FaqItem
            q="What happens if I go back to the free tier?"
            a="Your account and any cases beyond the free tier's limit stay in your account — you just won't be able to interact with them past the free tier's limits until you resubscribe."
          />
          <FaqItem
            q="Is the escalation toolkit legal advice?"
            a="No. CaseWhy is not a law firm and doesn't provide legal advice. The representative lookup and letter-drafting tools organize and format information you provide — they never generate legal conclusions or guarantee an outcome. For anything specific to your case, consult a licensed immigration attorney."
          />
        </div>
      </div>
    </main>
  );
}
