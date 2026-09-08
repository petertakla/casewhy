import Link from "next/link";

// Round 29 — ties the (currently two) separate "talk to a professional"
// directories together so they're discoverable as one coherent feature
// instead of a scavenger hunt across unlinked pages. Each entity type stays
// its own fully separate system (own table/page/flow, per
// partner-marketing-domain-concept.md) — this page is just the shared front
// door. More categories (legal aid orgs, university DSOs, community orgs,
// employers) get their own card here as each ships its own round; none of
// those are built yet, so none are listed yet.
const CATEGORIES = [
  {
    href: "/attorneys",
    label: "Attorneys",
    description:
      "Licensed immigration attorneys who can represent you and give advice specific to your case.",
  },
  {
    href: "/representatives",
    label: "Accredited representatives",
    description:
      "DOJ-accredited, non-lawyer representatives — often at nonprofits — authorized to practice immigration law.",
  },
];

export default function GetHelpPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Get help</h1>
      <p className="mt-2 text-muted">
        CaseWhy gives you plain-language information, not legal advice. When your situation needs
        a licensed professional&apos;s judgment, here&apos;s where to find one.
      </p>
      <div className="mt-8 space-y-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <p className="font-semibold text-foreground">{category.label}</p>
            <p className="mt-1 text-sm text-muted">{category.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
