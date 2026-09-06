import { EmailCaptureForm } from "./EmailCaptureForm";

function StatCard({ num, label }: { num: string; label: string }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-surface px-6 py-4 text-center">
      <p className="font-mono text-2xl font-bold text-brand-600 dark:text-brand-400">{num}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function FeatureCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-600 dark:text-brand-400">
        {step}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

function TrustItem({ lead, rest }: { lead: string; rest: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
      <p className="text-sm text-foreground/90">
        <strong className="font-semibold text-foreground">{lead}</strong> {rest}
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-500/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Coming soon
        </p>
        <h1 className="max-w-2xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Understand your USCIS case, not just its status.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Track your case automatically and get plain-English explanations of what each status
          update actually means for your timeline.
        </p>

        <EmailCaptureForm ctaLabel="Get notified at launch" sourcePage="landing-hero" />

        <p className="mt-4 text-xs text-muted">
          No spam. We&apos;ll only email you when CaseWhy is ready to try.
        </p>
      </div>

      <section className="border-y border-border bg-surface-2 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            USCIS backlogs are the worst they&apos;ve ever been
          </h2>
          <p className="mt-4 text-muted">
            Over 12 million cases are sitting in the system right now, and the official status
            page gives you a vague label and nothing else. You&apos;re left refreshing a page,
            guessing what &quot;Case Is Being Actively Reviewed&quot; actually means, and searching
            forums at midnight for someone in your exact situation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <StatCard num="12.1M+" label="pending USCIS cases" />
            <StatCard num="+42%" label="net backlog growth, year over year" />
            <StatCard num="1" label="status label, zero explanation" />
          </div>
          <p className="mt-4 text-xs text-muted">
            Source: USCIS quarterly caseload data, Q2 FY2026 — re-verified Sep 5, 2026, not carried
            over unchecked.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            What CaseWhy does differently
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Plain-language status explanations aren&apos;t rare anymore — several trackers do
            that now. Here&apos;s what&apos;s actually different about CaseWhy.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              step={1}
              title="Track"
              description="Add your receipt number and we check it for you, every day, through USCIS's own official case status system — no manual refreshing."
            />
            <FeatureCard
              step={2}
              title="Understand, with real sources"
              description="Explanations grounded in a curated USCIS policy and case-law knowledge base, with the specific policy cited — not a generic rewording of your status text."
            />
            <FeatureCard
              step={3}
              title="See the full picture"
              description="Official processing-time estimates and the current visa bulletin for your case type, right alongside your own status — not just a single label."
            />
            <FeatureCard
              step={4}
              title="Act"
              description="General next-step guidance for your situation, and a clear line to a licensed immigration attorney the moment something is specific to your case."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-2 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Built to be trusted with something this personal
          </h2>
          <div className="mx-auto mt-8 max-w-lg space-y-4">
            <TrustItem
              lead="Official data only."
              rest="Case status comes from USCIS's own systems — we don't scrape or guess."
            />
            <TrustItem
              lead="Your data isn't for sale."
              rest="We don't sell or rent your information to anyone, ever."
            />
            <TrustItem
              lead="Encrypted, and minimal by design."
              rest="We store only what's needed to track your case and keep it encrypted."
            />
          </div>
          <div className="mx-auto mt-6 max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-300">
            <strong className="font-semibold">
              CaseWhy is not a law firm and does not give legal advice.
            </strong>{" "}
            Everything CaseWhy tells you is general, informational guidance drawn from public
            USCIS process information. For anything specific to your case, we&apos;ll always point
            you toward a licensed immigration attorney.
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Be first to try CaseWhy</h2>
        <p className="mt-3 text-muted">
          We&apos;re building this in the open — daily case checks, policy-grounded explanations,
          processing times, and visa bulletin tracking are already working. Join the list and
          you&apos;ll be first to know the moment real-case tracking opens up.
        </p>
        <div className="mt-2 flex justify-center">
          <EmailCaptureForm ctaLabel="Notify me" sourcePage="landing-footer" />
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>&copy; 2026 CaseWhy. Not affiliated with or endorsed by USCIS or DHS.</span>
          <div className="flex gap-4">
            <a
              href="https://casewhy.com/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Privacy Policy
            </a>
            <a
              href="https://casewhy.com/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Terms of Service
            </a>
            <a href="mailto:hello@casewhy.com" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
