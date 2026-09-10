import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { ENTITY_TYPES } from "@/lib/get-help/entity-types";
import { GetHelpChooser } from "./GetHelpChooser";

// Round 29 — ties the separate "talk to a professional" directories
// together so they're discoverable as one coherent feature instead of a
// scavenger hunt across unlinked pages. Each entity type stays its own
// fully separate system (own table/page/flow, per
// partner-marketing-domain-concept.md) — this page is just the shared
// front door.
//
// New-task, same day — surfaced everywhere it belongs (nav on both sites,
// dashboard/chat/escalation-toolkit) and given its own slot for every
// entity type in the six-part backlog, live or not, rather than waiting to
// be added card-by-card as each ships — same "informational listing, not an
// endorsement" framing as /attorneys applies to the page as a whole, stated
// once at the top. Round 34 moved legal aid orgs from "Coming soon" to
// live; round 43 did the same for DSOs and community orgs. Round 58 added
// a 7th entity type (pro bono immigration-court representation), not part
// of the original six-part backlog. Only employers (entity type 6, gated
// on a team-accounts product decision) remains a placeholder.
//
// Round 60 — the category list itself now lives in
// src/lib/get-help/entity-types.ts (this page and the new chooser both read
// from it), and each live category shows a `whenToUse` trigger sentence
// alongside its description — answers "which one applies to me" directly,
// which the page never said anywhere before.

export default function GetHelpPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Get help</h1>
      <p className="mt-2 text-muted">
        CaseWhy gives you plain-language information, not legal advice. When your situation needs
        a licensed professional&apos;s judgment, here&apos;s where to find one.
      </p>
      <p className="mt-2 text-xs text-muted">
        This page is an informational list, not an endorsement or a referral service. CaseWhy
        doesn&apos;t vouch for outcomes, and being listed here doesn&apos;t mean any listing is
        right for your specific situation.
      </p>
      <p className="mt-2 text-xs text-muted">
        Every resource here is free to use, always — no fees, no ads, no hidden cost. Same as the
        rest of CaseWhy: we don&apos;t sell your data or run ads either.
      </p>

      <div className="mt-4">
        <ShareButton
          url="https://app.casewhy.com/get-help"
          title="CaseWhy — Get Help"
          text="Free legal aid, accredited representatives, attorneys, and more — all in one place. No fees. No ads."
        />
      </div>

      <div className="mt-8">
        <GetHelpChooser />
      </div>

      <div id="full-list" className="mt-8 scroll-mt-20 space-y-4">
        {ENTITY_TYPES.map((category) =>
          category.status === "live" && category.href ? (
            <Link
              key={category.id}
              href={category.href}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="font-semibold text-foreground">{category.label}</p>
              <p className="mt-1 text-sm text-muted">{category.description}</p>
              {category.whenToUse && (
                <p className="mt-2 text-sm text-brand-600 dark:text-brand-400">
                  Use this when: {category.whenToUse}
                </p>
              )}
            </Link>
          ) : (
            <div key={category.id} className="rounded-xl border border-dashed border-border-strong p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-muted">{category.label}</p>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{category.description}</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
