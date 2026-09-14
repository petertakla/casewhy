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
import { inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { marketingQueue } from "../db/schema";

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
      date: String(data.date ?? ""),
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

/** Every publicly-visible post, newest first. */
export async function getPublishedUpdates(): Promise<UpdatePost[]> {
  const approved = await approvedSlugSet();
  return readAllPostsFromDisk()
    .filter((p) => approved.has(p.slug))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post, only if it's actually approved -- callers should notFound() on null. */
export async function getPublishedUpdateBySlug(slug: string): Promise<UpdatePost | null> {
  const approved = await approvedSlugSet();
  if (!approved.has(slug)) return null;
  return readAllPostsFromDisk().find((p) => p.slug === slug) ?? null;
}

/** All post slugs that exist as files, regardless of approval -- for seeding the queue. */
export function getAllUpdateSlugsFromDisk(): string[] {
  return readAllPostsFromDisk().map((p) => p.slug);
}

export function updateDestination(slug: string): string {
  return destinationFor(slug);
}
