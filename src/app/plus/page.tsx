import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { startCheckout, openBillingPortal } from "./actions";

// Round 14 — each feature is now a hyperlink to its own fuller explanation
// (below, under "Plus, in depth") instead of a flat bullet, per the
// competitor-review revision — this also doubles as SEO landing-page
// content, the same role /processing-times and /visa-bulletin play.
interface PlusFeature {
  id: string;
  title: string;
  free: string;
  plus: string;
  explanation: string;
}

const PLUS_FEATURES: PlusFeature[] = [
  {
    id: "ai-chat",
    title: "AI chat about your case",
    free: "10 / month",
    plus: "Unlimited",
    explanation:
      "Ask a plain-language question about your case status, a policy term, or what a next step might mean, grounded in CaseWhy's curated policy/case-law knowledge base with visible citations — not a generic chatbot guessing. Free accounts get 10 questions a month; Plus removes the limit.",
  },
  {
    id: "tracked-cases",
    title: "Tracked cases (family)",
    free: "1",
    plus: "Up to 5",
    explanation:
      "Track up to 5 cases on one account — enough for a real household (a spouse, kids, parents) without needing separate logins or separate subscriptions. Free accounts track 1.",
  },
  {
    id: "on-demand-checks",
    title: "On-demand status checks",
    free: "—",
    plus: "Included",
    explanation:
      "Every account gets an automatic daily status check. Plus adds a \"check now\" button for the moment you're actually anxious about a case — no waiting for the next scheduled check.",
  },
  {
    id: "document-vault",
    title: "Secure document vault",
    free: "—",
    plus: "Included",
    explanation:
      "Upload and store supporting documents (an I-693, an RFE response, receipts) against a specific tracked case, encrypted and private to your account — handy to have organized in one place if you ever need to hand things off to an attorney.",
  },
  {
    id: "stalled-case-alert",
    title: "Stalled-case alert",
    free: "Included",
    plus: "Included",
    explanation:
      "CaseWhy flags a case that's gone unusually quiet relative to a typical timeline. This alert itself is free on every tier — it's the escalation tools that follow it (below) that are part of Plus.",
  },
  {
    id: "representative-lookup",
    title: "Representative lookup",
    free: "—",
    plus: "Included",
    explanation:
      "Once a case is flagged as stalled, look up your actual U.S. Senators and House representative by address — real, current officials, not a static list — as a starting point for a congressional inquiry.",
  },
  {
    id: "escalation-letters",
    title: "Escalation letter drafting",
    free: "—",
    plus: "Included",
    explanation:
      "Draft one of three real escalation letters — a congressional inquiry, a field-office follow-up, or a formal USCIS Ombudsman case-assistance request — pre-filled with your case's details. Not legal advice; each letter is a starting point you review and send yourself.",
  },
  {
    id: "pdf-report",
    title: "Attorney-handoff PDF report",
    free: "—",
    plus: "Included",
    explanation:
      "Generate a one-page PDF summarizing your case's status and plain-language explanation — useful to hand an attorney directly if you ever need one, without re-explaining everything from scratch.",
  },
];

function FeatureRow({ id, title, free, plus }: { id: string; title: string; free: string; plus: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border py-4 text-sm last:border-b-0 sm:grid-cols-[1fr_140px_140px]">
      <a href={`#${id}`} className="font-medium text-foreground/90 hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
        {title}
      </a>
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
        {PLUS_FEATURES.map((feature) => (
          <FeatureRow key={feature.id} id={feature.id} title={feature.title} free={feature.free} plus={feature.plus} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        The stalled-case alert itself is always free — only the representative lookup and letter
        drafting that follow it are part of CaseWhy Plus.
      </p>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Plus, in depth</h2>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface px-6">
          {PLUS_FEATURES.map((feature) => (
            <div key={feature.id} id={feature.id} className="scroll-mt-20 py-4">
              <p className="font-semibold">{feature.title}</p>
              <p className="mt-1.5 text-sm text-muted">{feature.explanation}</p>
            </div>
          ))}
        </div>
      </div>

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
