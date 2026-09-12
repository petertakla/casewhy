import Link from "next/link";
import { EmailCaptureForm } from "./EmailCaptureForm";
import { ShareButton } from "@/components/ShareButton";

// Round 71 — reconciled with casewhy.com's current live content (fetched
// fresh, not from memory or a stale snapshot — see round71 verification
// notes) after this page had drifted for many rounds. casewhy.com is the
// public-facing marketing front door and stays the source of truth; this
// page is the same app that already has real sign-in/tracking/chat behind
// it, so its own landing page shouldn't undersell what's actually built
// just because it grew independently of the static site. Not a merge of
// the two domains — see CLOUD_CLAUDE.md for why that's still gated on
// production USCIS API access.

function StatCard({ num, label }: { num: string; label: string }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-surface px-6 py-4 text-center">
      <p className="font-mono text-2xl font-bold text-brand-600 dark:text-brand-400">{num}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  wide,
  children,
}: {
  step: number;
  title: string;
  description: string;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-6 ${wide ? "sm:col-span-2 lg:col-span-2" : ""}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-600 dark:text-brand-400">
        {step}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {children}
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

function GetHelpCard({
  href,
  title,
  badge,
  description,
}: {
  href: string | null;
  title: string;
  badge: string;
  description: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            href
              ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
              : "bg-surface-2 text-muted"
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </>
  );

  if (!href) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface p-5">{inner}</div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      {inner}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main>
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-500/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Coming soon — built and tested, waiting on final USCIS approval
        </p>
        <h1 className="max-w-2xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Know what&apos;s happening. Know what to do next.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          CaseWhy checks your case with USCIS every day and explains what changed in plain
          English — grounded in real USCIS policy, not a reworded status label. When that&apos;s
          not enough, we connect you to real help: free legal aid, accredited representatives, and
          attorneys — all free, no ads, ever.
        </p>

        <div className="mt-6">
          <ShareButton
            url="https://app.casewhy.com"
            title="CaseWhy"
            text="Track your USCIS case, understand what's actually happening, and find real help — free, no ads, ever."
          />
        </div>

        <div className="mt-6">
          <EmailCaptureForm ctaLabel="Notify me at launch" sourcePage="landing-hero" />
        </div>

        <p className="mt-4 text-xs text-muted">
          Built and tested. Opening the moment USCIS grants production access.
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
          <h2 className="text-center text-2xl font-bold tracking-tight">What&apos;s already built</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Not a mockup of the plan — this is what&apos;s actually running today, tested against
            USCIS&apos;s own sandbox environment.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              step={1}
              title="Daily automatic checks"
              description="We check your case with USCIS every day and notify you the moment anything changes — by email, and by push notification if you've enabled it — no refreshing, no guessing."
            />
            <FeatureCard
              step={2}
              title="Explanations grounded in real policy"
              description="When your status changes, CaseWhy explains what it actually means — and when a real USCIS policy memo, court ruling, or backlog might be why, it shows you the source, not just an AI's guess."
            />
            <FeatureCard
              step={3}
              title="Ask CaseWhy anything"
              description="Have a question about your case at 2am? Ask. CaseWhy answers using your case's real status and history, and always points you to a licensed attorney the moment a question needs real legal advice."
            />
            <FeatureCard
              step={4}
              title="Processing times and the Visa Bulletin, side by side"
              description="Official USCIS processing-time ranges and the current Visa Bulletin, right next to your own case — not a separate tab you have to remember to check."
              wide
            >
              {/* Static marketing screenshots — same <img>-not-<Image> precedent as Logo.tsx. */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <img
                  src="/screenshots/processing-times.jpg"
                  alt="A real screenshot of CaseWhy's processing times page, showing USCIS's published processing-time estimates by form type."
                  className="w-full rounded-lg border border-border"
                />
                <img
                  src="/screenshots/visa-bulletin.jpg"
                  alt="A real screenshot of CaseWhy's visa bulletin page, showing the current Final Action Dates table by category and country."
                  className="w-full rounded-lg border border-border"
                />
              </div>
            </FeatureCard>
            <FeatureCard
              step={5}
              title="CaseWhy Plus, coming at launch"
              description="Unlimited case tracking for your whole family, unlimited questions, on-demand checks, a secure document vault, an escalation toolkit for stalled cases (representative lookup plus congressional, field-office, and USCIS Ombudsman letter templates), and an attorney-ready case report you can bring to a consultation."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-2 px-6 py-16" id="get-help">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            More than a tracker — real help, free
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Other case trackers stop at a status update. CaseWhy connects you to real help —
            attorneys, accredited representatives, and free legal aid — built into the app.
          </p>
          <p className="mt-2 text-center text-sm font-semibold text-brand-600 dark:text-brand-400">
            Free to use, always — no fees, no ads, ever.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Not sure which one you need? Answer two quick questions and we&apos;ll point you to
            the right option — or just ask CaseWhy&apos;s AI directly, free, no sign-up required.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <GetHelpCard
              href="/attorneys"
              title="Attorneys"
              badge="Live"
              description="Board-certified immigration attorneys, sourced from official state bar records — free to browse, free to be listed."
            />
            <GetHelpCard
              href="/accredited-representatives"
              title="Accredited representatives"
              badge="Live, nationwide"
              description="DOJ-accredited representatives in all 50 states, sourced directly from official government records."
            />
            <GetHelpCard
              href="/legal-aid"
              title="Legal aid & nonprofit organizations"
              badge="Live, nationwide"
              description="Free and low-cost legal help for those who need it most, sourced from official nonprofit records."
            />
            <GetHelpCard
              href="/pro-bono-representation"
              title="Pro bono immigration-court representation"
              badge="Live, nationwide"
              description="Free representation in immigration court proceedings, organized by court, sourced from EOIR's own list."
            />
            <GetHelpCard
              href="/dso"
              title="University international student offices"
              badge="Live, nationwide"
              description="Find your school's international student office, sourced from DHS's own certified school directory."
            />
            <GetHelpCard
              href="/community-orgs"
              title="Community & cultural organizations"
              badge="Live, nationwide"
              description="Local, trusted organizations that understand your community, sourced from official USCIS grant records."
            />
            <GetHelpCard
              href={null}
              title="For employers"
              badge="Coming soon"
              description="Sponsoring or relocating employees? We can help."
            />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/get-help"
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Explore Get Help →
            </Link>
            <Link
              href="/get-help/ask"
              className="rounded-lg border border-border-strong px-5 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-surface-2 dark:text-brand-400"
            >
              Ask a free question →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
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
              lead="Encrypted at rest with AES-256,"
              rest="the same standard used for banking data — and minimal by design: we only ever store what's needed to track your case."
            />
            <TrustItem
              lead="No hallucinated citations."
              rest="Every policy or case-law reference CaseWhy shows you is matched against your case's actual facts by code, not invented by the AI or presented as more certain than it is."
            />
            <TrustItem
              lead="Your data isn't for sale."
              rest="We don't sell or rent your information to anyone, ever."
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

      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-xl text-left">
          <h2 className="text-xl font-bold tracking-tight">Why I built this</h2>
          <p className="mt-3.5 text-sm text-muted">
            I built CaseWhy because I lived this. My wife&apos;s, my daughter&apos;s, and my own
            naturalization cases sat in months of unexplained silence after our interviews — just
            a status label that hadn&apos;t moved. It took an email to my congressional
            representative&apos;s office to learn why: a USCIS policy memo, later struck down in
            court, had quietly paused cases like ours. Nobody at USCIS was going to volunteer
            that. CaseWhy exists so the next person doesn&apos;t have to fight as hard just to
            find out why.
          </p>
          <p className="mt-3.5 text-sm font-semibold text-foreground">— Peter, founder of CaseWhy</p>
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
            <a href="/get-help" className="hover:text-foreground">
              Get Help
            </a>
            <a href="/faq" className="hover:text-foreground">
              FAQ
            </a>
            <a href="/sitemap" className="hover:text-foreground">
              Site Index
            </a>
          </div>
          <ShareButton
            url="https://casewhy.com"
            title="CaseWhy"
            text="Track your USCIS case, understand what's actually happening, and find real help — free, no ads, ever."
            label="Share CaseWhy"
          />
        </div>
      </footer>
    </main>
  );
}
