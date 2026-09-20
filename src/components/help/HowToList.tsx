import Link from "next/link";
import type { HelpEntry } from "@/lib/help/types";

// Round 124 — the shared numbered-steps renderer for kind: 'howto' entries,
// used by both the public Help Center (/help) and the admin How-To guide
// (/admin/how-to). Deliberately has no awareness of audience at all — no
// isAdminEmail check, no public-only styling branch. The calling page
// decides which entries to pass in; this component only renders what it's
// given. That's what keeps the admin gate real: a non-admin session can
// only ever see admin content if some *caller* handed it to this
// component, and no caller other than the isAdminEmail-gated
// /admin/how-to page ever does.

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function EntryTitle({ entry }: { entry: HelpEntry }) {
  if (!entry.href) {
    return <h3 className="text-base font-semibold text-foreground">{entry.title}</h3>;
  }
  const className = "text-base font-semibold text-brand-600 hover:underline dark:text-brand-400";
  if (isExternalHref(entry.href)) {
    return (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={className}>
        {entry.title} <span aria-hidden="true">↗</span>
      </a>
    );
  }
  return (
    <Link href={entry.href} className={className}>
      {entry.title}
    </Link>
  );
}

function HowToEntry({ entry }: { entry: HelpEntry }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <EntryTitle entry={entry} />
      {entry.steps && entry.steps.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          {entry.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      {entry.notes && entry.notes.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted">
          {entry.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Renders a flat list of how-to entries, grouped by their own `group`
 * field, in first-seen order. Any audience, any grouping scheme — the
 * caller decides both by what it passes in. */
export function GroupedHowToList({ entries }: { entries: HelpEntry[] }) {
  const groups: string[] = [];
  for (const entry of entries) {
    if (!groups.includes(entry.group)) groups.push(entry.group);
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">{group}</h2>
          <div className="space-y-4">
            {entries
              .filter((e) => e.group === group)
              .map((entry) => (
                <HowToEntry key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
