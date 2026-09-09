"use client";

// Round 36 — a permalink page's "back to all" link previously hard-linked to
// the bare, unfiltered list URL, dropping whatever <StateFilter> selection
// (state/search) the user had applied before clicking into an entry. Since
// StateFilter now reflects its selection in the list URL's own query string,
// and a Next.js <Link> click pushes (never replaces) a new history entry,
// the list page's exact filtered URL is still sitting one entry back in
// this tab's session history — router.back() lands on it precisely.
//
// document.referrer is deliberately NOT used to decide this: it reflects
// only the browser's original hard navigation into the current document and
// never updates across client-side route transitions, so it can't tell
// "came from the filtered list" apart from "arrived via any other route."
// window.history.length is the correct signal here — it's >1 whenever this
// tab has actually navigated somewhere in-app before reaching this page.

import Link from "next/link";
import { useRouter } from "next/navigation";

export function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className="text-sm text-brand-600 hover:underline dark:text-brand-400"
      onClick={(e) => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      ← {label}
    </Link>
  );
}
