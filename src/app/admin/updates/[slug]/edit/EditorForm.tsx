"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { saveOverride, revertOverride } from "../../actions";
import type { UpdateSource } from "@/lib/updates/updates";

// Round 107 — Markdown-only editor with a live preview, deliberately no
// rich-text widget (the task doc's own choice: sources stay structured
// title+url fields, not prose, so the "every claim cites its source"
// guardrail can't be edited away by accident). The preview uses the exact
// same react-markdown component mapping as the public permalink page
// (src/app/updates/[slug]/page.tsx), so what's previewed here really is
// what publishes.

const MARKDOWN_COMPONENTS = {
  h2: (props: React.ComponentProps<"h2">) => <h2 className="mt-6 text-lg font-bold tracking-tight text-foreground" {...props} />,
  h3: (props: React.ComponentProps<"h3">) => <h3 className="mt-5 font-semibold text-foreground" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="list-disc space-y-1 pl-5" {...props} />,
  ol: (props: React.ComponentProps<"ol">) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a className="font-semibold text-brand-600 hover:underline dark:text-brand-400" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props: React.ComponentProps<"em">) => <em className="text-muted" {...props} />,
};

export function EditorForm({
  slug,
  initialTitle,
  initialSummary,
  initialBodyMd,
  initialSources,
  initialOgImage,
  hasOverride,
  isPublished,
}: {
  slug: string;
  initialTitle: string;
  initialSummary: string;
  initialBodyMd: string;
  initialSources: UpdateSource[];
  initialOgImage: string;
  hasOverride: boolean;
  isPublished: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [bodyMd, setBodyMd] = useState(initialBodyMd);
  const [sources, setSources] = useState<UpdateSource[]>(initialSources.length > 0 ? initialSources : [{ title: "", url: "" }]);
  const [ogImage, setOgImage] = useState(initialOgImage);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [edited, setEdited] = useState(hasOverride);
  const [confirmingRevert, setConfirmingRevert] = useState(false);

  function updateSource(index: number, field: "title" | "url", value: string) {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    setSaved(false);
  }

  function removeSource(index: number) {
    setSources((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await saveOverride({
        slug,
        title,
        summary,
        bodyMd,
        sources: sources.filter((s) => s.title.trim() || s.url.trim()),
        ogImage,
      });
      setEdited(true);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  async function handleRevert() {
    setPending(true);
    setError(null);
    try {
      await revertOverride(slug);
      // A full reload, not a client-side reset to initialTitle/etc --
      // those props reflect whatever was live when this page first
      // mounted, which (if an override already existed at that point) is
      // the very content just deleted, not the true repo file. Caught
      // live: after a real revert, the form kept showing the overridden
      // text until the page was manually reloaded, which would read as
      // "revert didn't work" even though the DB row was genuinely gone.
      // Reloading re-fetches the server component's props from scratch,
      // which is what the merge point (getUpdateBySlugFromDisk) now
      // resolves to -- the actual repo file.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div>
      {isPublished && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          This post is live — saving publishes the edit immediately.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setSaved(false);
              }}
              rows={2}
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Sources</label>
            <div className="space-y-2">
              {sources.map((source, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={source.title}
                    onChange={(e) => updateSource(i, "title", e.target.value)}
                    placeholder="Source title"
                    className="w-2/5 rounded-lg border border-border-strong bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    value={source.url}
                    onChange={(e) => updateSource(i, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-border-strong bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSource(i)}
                    className="rounded-lg border border-border-strong px-2 text-xs text-muted hover:border-red-500/50 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSources((prev) => [...prev, { title: "", url: "" }]);
                setSaved(false);
              }}
              className="mt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              + Add source
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Og image (URL, optional)</label>
            <input
              value={ogImage}
              onChange={(e) => {
                setOgImage(e.target.value);
                setSaved(false);
              }}
              placeholder="https://..."
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Body (Markdown)</label>
            <textarea
              value={bodyMd}
              onChange={(e) => {
                setBodyMd(e.target.value);
                setSaved(false);
              }}
              rows={22}
              className="w-full rounded-lg border border-border-strong bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-muted">## heading · **bold** · [text](url)</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted">Live preview</label>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">{summary}</p>
            <div className="update-content mt-4 space-y-4 text-sm leading-relaxed text-foreground/90">
              <ReactMarkdown components={MARKDOWN_COMPONENTS}>{bodyMd}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {saved && !error && <p className="mt-4 text-sm text-green-600 dark:text-green-400">Saved — the override is live.</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <a
          href={`/updates/${slug}?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-brand-500/50"
        >
          Preview full page ↗
        </a>

        {edited &&
          (confirmingRevert ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-muted">Delete the override and go back to the repo file?</span>
              <button
                type="button"
                disabled={pending}
                onClick={handleRevert}
                className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-500/10"
              >
                Confirm revert
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRevert(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingRevert(true)}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
            >
              Revert to repo file
            </button>
          ))}

        <Link href="/admin/updates" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          ← Back to Updates
        </Link>
      </div>
    </div>
  );
}
