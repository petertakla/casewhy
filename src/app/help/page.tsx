import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/site/metadata";
import { GroupedHowToList } from "@/components/help/HowToList";
import { PUBLIC_HOWTO_ENTRIES } from "@/lib/help/public-howto";

// Round 124 — the public How-To Guides page, extending round 104's /faq
// into a real "how do I use this" surface. Named "How-To Guides" rather
// than "Help Center" so it doesn't read as a rename/duplicate of the
// existing "Get Help" directories (attorneys, legal aid, etc.) — these
// two are answering genuinely different questions ("who can help me" vs.
// "how do I use this app"), and reusing "Help" in the name would blur that.
// Built specifically so /admin/
// how-to (round 120's original ask) could reuse the same rendering
// components rather than being a one-off (Peter's own explicit ask:
// "design it with that mind-set so components can be easily reusable for
// both general users and the admin user").
//
// /faq is linked to here, not embedded. Embedding its 16 questions
// through GroupedHowToList would mean either building a second renderer
// (Part 3's FAQ accordion) with no other real caller this round, or
// re-deriving its FAQPage JSON-LD from data these components don't carry
// (plainText, Spanish parity across 4 page variants). Round 104's FAQ
// already has real, working SEO investment (round 73/97/99/104) — linking
// out is the lower-risk choice per the task doc's own explicit permission
// to pick whichever is safer, and keeps /faq completely untouched.
//
// No PublicPage wrapper / LanguageSwitcher, and no PageFilter, on purpose:
// this page is English-only this round (no Spanish equivalent to switch
// to — same reasoning the /*/join application forms already use, see
// attorneys/join/page.tsx's own plain <main> wrapper), and PageFilter
// only searches round 110's site-search index, which doesn't have this
// page's content indexed yet — showing a search box that always returns
// zero results would be worse than no search box. Search here is
// explicitly out of scope this round (a round-110 follow-up instead).
export const metadata: Metadata = pageMetadata("/help", {
  title: "How-To Guides | CaseWhy",
  description: "Step-by-step guides for using CaseWhy — tracking a case, notifications, Ask CaseWhy, Plus, and finding legal help.",
});

// Round 110 follow-up's AuthHeader reasoning applies here too — this page
// needs the real signed-in header, same as /faq.
export const dynamic = "force-dynamic";

export default function HowToGuidesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 pt-10">
      <h1 className="text-2xl font-bold tracking-tight">How-To Guides</h1>
      <p className="mb-2 mt-2 text-muted">
        Step-by-step guides for using CaseWhy. Looking for a quick answer instead? See the{" "}
        <Link href="/faq" className="text-brand-600 hover:underline dark:text-brand-400">
          Frequently Asked Questions
        </Link>
        .
      </p>
      <p className="mb-8 text-sm text-muted">English only for now — the FAQ above is available in Spanish.</p>

      <GroupedHowToList entries={PUBLIC_HOWTO_ENTRIES} />
    </main>
  );
}
