import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedUpdates } from "@/lib/updates/updates";
import { ShareButton } from "@/components/ShareButton";

// Round 93 — the public list page for CaseWhy's editorial blog. Same
// list+permalink shape as /policy and /news, but the posts rendered here
// are filtered to only those whose round 89 marketing_queue row has
// reached posted/edited_posted (see getPublishedUpdates) — a post's
// content file can exist in the repo well before it's actually live.

export const metadata: Metadata = {
  title: "Updates | CaseWhy",
  description:
    "Plain-language explanations of how USCIS processing actually works, written by the team building CaseWhy.",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function UpdatesIndexPage() {
  const posts = await getPublishedUpdates();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
      <p className="mb-8 mt-2 text-muted">
        Plain-language explanations of how USCIS processing actually works — what a status means,
        how to read the Visa Bulletin, when to escalate — written once, for anyone to read.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <ShareButton
          url="https://app.casewhy.com/updates"
          title="CaseWhy — Updates"
          text="Plain-language explanations of how USCIS processing actually works, from CaseWhy."
        />
        <a
          href="/updates/feed.xml"
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          RSS feed
        </a>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">No posts yet — check back soon.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/updates/${post.slug}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {formatDate(post.date)}
              </p>
              <p className="mt-1.5 font-semibold text-foreground">{post.title}</p>
              <p className="mt-1 text-sm text-muted">{post.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
