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
      "Your status just changed to \"Request for Evidence\" and you don't know what that means, whether your timeline just reset, or what USCIS actually wants — that's exactly what the chat is for. Ask in plain English and get an answer grounded in CaseWhy's own curated policy and case-law knowledge base, with visible citations you can check yourself, instead of a generic chatbot guessing from general training data. On the free tier, 10 questions a month sounds like a lot until the week your case actually changes — that's usually when you have five follow-up questions in a single evening, and by Thursday you're locked out until next month. Plus removes the limit entirely, so you can ask a question the moment you're anxious about one, not ration them.",
  },
  {
    id: "tracked-cases",
    title: "Tracked cases (family)",
    free: "1",
    plus: "Up to 10",
    explanation:
      "A free account tracks exactly one case — fine if it's just you, but most immigration cases aren't solo: a spouse's I-485 alongside your own, kids' derivative cases, or parents you're helping through an N-400 you understand better than they do. Plus lets one account track up to 10 cases at once, so the whole household lives under a single login instead of everyone creating separate accounts (and separate $9.99/mo subscriptions) just to see their own status. Each case gets its own full CaseWhy experience — its own status history, its own AI explanations, its own document vault — switched between with a single click, not re-entered from scratch every time.",
  },
  {
    id: "on-demand-checks",
    title: "On-demand status checks",
    free: "—",
    plus: "Included",
    explanation:
      "Every account, free or Plus, gets an automatic status check once a day. Most days that's plenty — but the day your case might actually have moved isn't most days. Plus adds a real \"Check now\" button right on the dashboard for exactly that moment: you heard something changed, or it's just been quiet too long and you want to know right now instead of waiting for tomorrow's scheduled check. It calls USCIS directly, the same way the daily check does, just on your schedule instead of a fixed one.",
  },
  {
    id: "document-vault",
    title: "Secure document vault",
    free: "—",
    plus: "Included",
    explanation:
      "An RFE lands with a deadline and a list of documents USCIS wants — pay stubs, a new I-693, a marriage certificate, whatever it is. The vault is where you put them as you gather them, attached to that specific case, encrypted, and private to your account (backed by Vercel's private Blob storage, not a shared folder). It's most useful in the exact moment things get stressful: instead of a downloads folder full of scans you'll never find again, everything relevant to one case lives in one place — genuinely handy if you ever need to hand a case off to an attorney and don't want to re-gather everything from scratch.",
  },
  {
    id: "stalled-case-alert",
    title: "Stalled-case alert",
    free: "Included",
    plus: "Included",
    explanation:
      "CaseWhy flags a case that's gone unusually quiet relative to a real benchmark — not a guess, but how long cases like yours typically take before the next real step. This alert itself is free on every tier, by design: knowing something might be stuck shouldn't be behind a paywall. It's the two escalation tools that follow a stall alert — representative lookup and letter drafting, both below — that are part of Plus, since acting on a stall (versus just being told about one) is where the real value is.",
  },
  {
    id: "representative-lookup",
    title: "Representative lookup",
    free: "—",
    plus: "Included",
    explanation:
      "Once a case is flagged as stalled, a lot of people's first instinct is \"can my member of Congress help with this?\" — and most don't actually know who that is, or have an outdated name from years ago. Enter your address and CaseWhy looks up your real, current U.S. Senators and House representative — pulled from live government data, not a static list that goes stale after every election — as a genuine starting point for a congressional inquiry, one of the more effective real-world ways to get a stuck case looked at.",
  },
  {
    id: "escalation-letters",
    title: "Escalation letter drafting",
    free: "—",
    plus: "Included",
    explanation:
      "Knowing who to contact is one problem; knowing what to actually write is another. Plus can draft one of three real letters — a congressional inquiry to the representative you just looked up, a follow-up to your specific field office, or a formal USCIS Ombudsman case-assistance request — pre-filled with your case's real details so you're not staring at a blank page. This is deliberately not legal advice: every draft is adversarially tested to refuse fabricating claims or overstating your situation, and it's a starting point you review, edit, and send yourself, not something CaseWhy sends on your behalf.",
  },
  {
    id: "pdf-report",
    title: "Attorney-handoff PDF report",
    free: "—",
    plus: "Included",
    explanation:
      "If a case reaches the point where you actually need an attorney, the first meeting usually starts with you re-explaining everything from the beginning while they take notes. This generates a real one-page PDF instead — your case's current status and CaseWhy's own plain-language explanation of it, ready to hand over or attach to an email — so that first conversation starts from \"here's where things stand\" instead of starting from zero.",
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
      <p className="mt-1 text-xs text-muted">
        <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
          Get Help
        </Link>{" "}
        — finding an attorney or accredited representative — is free on every tier too, not a
        Plus perk.
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
