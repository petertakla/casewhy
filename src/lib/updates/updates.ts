// Round 93 — reads /updates posts from content/updates/*.md (frontmatter
// via gray-matter, no CMS, per the task doc's explicit "no CMS"
// instruction). Editorial content lives as files, same spirit as
// POLICY_MEMOS/PROCESSING_TIMES being hand-maintained TS data rather than
// a database table — but unlike those, a post's *public visibility* is
// gated through the round 89 marketing_queue rather than "exists in the
// repo = live," per the seed-posts doc's own instruction: "Peter reviews
// each post once in the round 89 queue (channel = blog, auto_post)
// before it goes live — that is his only step." A post's file can exist
// in the repo (it has to, for this module to know about it at all) while
// still being invisible on the live site until its queue row reaches
// posted/edited_posted -- see approvedSlugSet() below, which every public
// listing/detail path checks.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { marketingQueue, updatesOverrides } from "../db/schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "updates");

export interface UpdateSource {
  title: string;
  url: string;
}

export interface UpdatePost {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  pillar: string;
  sources: UpdateSource[];
  ogImage: string;
  lang: string;
  content: string; // raw Markdown body, rendered by the page component
}

function destinationFor(slug: string): string {
  return `/updates/${slug}`;
}

// Round 107 — an admin edit of a post, DB-backed (updates_overrides),
// keyed by slug. The raw shape a row actually holds, distinct from
// UpdatePost (which is the merged, rendered-ready shape every public
// reader gets) -- the editor form works with this shape directly.
export interface UpdateOverride {
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  sources: UpdateSource[];
  ogImage: string | null;
  updatedAt: Date;
  updatedBy: string;
}

function parseOverrideRow(row: typeof updatesOverrides.$inferSelect): UpdateOverride {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMd: row.bodyMd,
    sources: JSON.parse(row.sourcesJson) as UpdateSource[],
    ogImage: row.ogImage,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

/** Every override row, one query, keyed by slug. Used both to merge posts for public readers and to compute the admin list's "Edited" chips. */
export async function getOverridesMap(): Promise<Map<string, UpdateOverride>> {
  const db = getDb();
  const rows = await db.select().from(updatesOverrides);
  return new Map(rows.map((row) => [row.slug, parseOverrideRow(row)]));
}

/** A single slug's override row, or null if the post is unedited (still exactly the repo file). */
export async function getOverrideForSlug(slug: string): Promise<UpdateOverride | null> {
  const db = getDb();
  const [row] = await db.select().from(updatesOverrides).where(eq(updatesOverrides.slug, slug));
  return row ? parseOverrideRow(row) : null;
}

function mergeOverride(post: UpdatePost, override: UpdateOverride | undefined): UpdatePost {
  if (!override) return post;
  return {
    ...post,
    title: override.title,
    summary: override.summary,
    content: override.bodyMd,
    sources: override.sources,
    ogImage: override.ogImage ?? post.ogImage,
  };
}

/** Every post on disk, with any DB override applied. The single merge point every public/admin reader below goes through -- nothing else reads readAllPostsFromDisk() directly. */
async function readAllPostsMerged(): Promise<UpdatePost[]> {
  const posts = readAllPostsFromDisk();
  const overrides = await getOverridesMap();
  return posts.map((p) => mergeOverride(p, overrides.get(p.slug)));
}

// Round 103, real bug found while building the admin preview (the first
// time any of these posts' [slug]/page.tsx had ever actually rendered --
// all five have sat unapproved since round 93, so this never fired
// before). Every post's frontmatter writes `date: 2026-09-15` unquoted --
// valid YAML, but gray-matter's underlying js-yaml parser resolves an
// unquoted YYYY-MM-DD scalar to a native JS Date, not the plain string
// this module's own UpdatePost.date comment ("YYYY-MM-DD") assumes.
// String(aDateObject) produces "Mon Sep 15 2026 00:00:00 GMT+0000 (...)",
// which `${post.date}T00:00:00Z` then turns into "Invalid Date" wherever
// it's parsed again -- would have shipped to the first real reader.
function normalizeFrontmatterDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

function readAllPostsFromDisk(): UpdatePost[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: String(data.title ?? slug),
      date: normalizeFrontmatterDate(data.date),
      summary: String(data.summary ?? ""),
      pillar: String(data.pillar ?? ""),
      sources: Array.isArray(data.sources) ? data.sources : [],
      ogImage: String(data.og_image ?? ""),
      lang: String(data.lang ?? "en"),
      content,
    };
  });
}

/** Which /updates slugs are actually approved to show publicly, per the round 89 queue. */
async function approvedSlugSet(): Promise<Set<string>> {
  const db = getDb();
  const posts = readAllPostsFromDisk();
  const destinations = posts.map((p) => destinationFor(p.slug));
  if (destinations.length === 0) return new Set();

  const rows = await db
    .select({ destination: marketingQueue.destination, status: marketingQueue.status })
    .from(marketingQueue)
    .where(inArray(marketingQueue.destination, destinations));

  const approved = new Set<string>();
  for (const row of rows) {
    if (row.status === "posted" || row.status === "edited_posted") {
      approved.add(row.destination.replace("/updates/", ""));
    }
  }
  return approved;
}

/** Every publicly-visible post, newest first, with any DB override applied. */
export async function getPublishedUpdates(): Promise<UpdatePost[]> {
  const [approved, posts] = await Promise.all([approvedSlugSet(), readAllPostsMerged()]);
  return posts.filter((p) => approved.has(p.slug)).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post, only if it's actually approved -- callers should notFound() on null. With any DB override applied. */
export async function getPublishedUpdateBySlug(slug: string): Promise<UpdatePost | null> {
  const approved = await approvedSlugSet();
  if (!approved.has(slug)) return null;
  const posts = await readAllPostsMerged();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** All post slugs that exist as files, regardless of approval -- for seeding the queue. Deliberately disk-only: overrides never add/remove slugs, only edit content. */
export function getAllUpdateSlugsFromDisk(): string[] {
  return readAllPostsFromDisk().map((p) => p.slug);
}

// Round 103 — server-only, reads a post regardless of the round-89 queue
// gate above. Exists so an admin can read the actual 500-700 word article
// before approving it, not just the title + one-sentence summary the
// queue card previously showed. Callers must gate this behind their own
// isAdminEmail check (src/app/updates/[slug]/page.tsx's ?preview=1 path)
// -- this function itself does no auth, same as readAllPostsFromDisk.
//
// Round 107 — now also applies the DB override for this slug, if one
// exists (async as of this round for that reason). The admin preview
// route, the editor's own prefill, and the marketing queue card's Blog
// title/summary all read through this one function, so none of them can
// ever disagree about what "the current post" actually is.
export async function getUpdateBySlugFromDisk(slug: string): Promise<UpdatePost | null> {
  const post = readAllPostsFromDisk().find((p) => p.slug === slug);
  if (!post) return null;
  const override = await getOverrideForSlug(slug);
  return mergeOverride(post, override ?? undefined);
}

export function updateDestination(slug: string): string {
  return destinationFor(slug);
}

// Round 107 — /admin/updates' list page. Every post on disk, merged,
// with its round-89 queue status and whether it has an override -- the
// "Edited" chip's source of truth is the same overrides map the merge
// point above uses, so the chip and the actual merged content can never
// disagree.
export interface AdminUpdateRow {
  slug: string;
  title: string;
  date: string;
  publishStatus: "posted" | "edited_posted" | "pending" | "approved" | "escalated" | "skipped" | "rejected" | "not_queued";
  edited: boolean;
}

export async function getUpdatesForAdmin(): Promise<AdminUpdateRow[]> {
  const db = getDb();
  const [posts, overrides] = await Promise.all([readAllPostsMerged(), getOverridesMap()]);
  const destinations = posts.map((p) => destinationFor(p.slug));

  const rows = destinations.length
    ? await db
        .select({ destination: marketingQueue.destination, status: marketingQueue.status })
        .from(marketingQueue)
        .where(inArray(marketingQueue.destination, destinations))
    : [];
  const statusBySlug = new Map<string, AdminUpdateRow["publishStatus"]>(
    rows.map((r) => [r.destination.replace("/updates/", ""), r.status])
  );

  return posts
    .map(
      (p): AdminUpdateRow => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        publishStatus: statusBySlug.get(p.slug) ?? "not_queued",
        edited: overrides.has(p.slug),
      })
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
