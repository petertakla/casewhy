// Round 73 (real) — SOCIAL_MEDIA_GUARDRAILS.md Section 1: "no identical or
// near-identical replies posted to more than one subreddit, group, or
// forum thread." Checks a candidate draft against every marketing_queue
// row from the last DEDUP_WINDOW_DAYS using word-shingle Jaccard
// similarity -- no new dependency added, this project's schema has no
// existing text-similarity tool and the comparison set is small enough
// (a handful of drafts/day) that a lightweight, dependency-free check is
// the right amount of engineering for what this actually needs.

import { gte } from "drizzle-orm";
import { getDb } from "../db/client";
import { marketingQueue } from "../db/schema";
import { DEDUP_WINDOW_DAYS } from "./config";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(text: string, size = 3): Set<string> {
  const words = normalize(text).split(" ").filter(Boolean);
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  return result;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const shingle of a) {
    if (b.has(shingle)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.6;

/** True if draftText is near-identical to any marketing_queue draft from the last DEDUP_WINDOW_DAYS. */
export async function isNearDuplicateDraft(draftText: string): Promise<boolean> {
  const db = getDb();
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const recent = await db
    .select({ draftText: marketingQueue.draftText })
    .from(marketingQueue)
    .where(gte(marketingQueue.createdAt, cutoff));

  const candidateShingles = shingles(draftText);
  for (const row of recent) {
    if (!row.draftText) continue;
    if (jaccardSimilarity(candidateShingles, shingles(row.draftText)) >= SIMILARITY_THRESHOLD) {
      return true;
    }
  }
  return false;
}
