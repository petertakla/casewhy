// Round 93 — one-time seed of marketing_queue rows for the 5 seed
// /updates posts, so Peter can review/approve each one in
// /admin/marketing before it goes live (channel=blog is gated: see
// src/lib/updates/updates.ts). Safe to re-run: onConflictDoNothing keyed
// on the (channel, destination) unique constraint, same pattern as
// seed-email-alias-configs.ts.
//
// Round 126 follow-up — round 90 widened marketing_queue's real unique
// constraint from (channel, destination) to (channel, destination, locale)
// (a later Spanish draft for the same item needs to coexist with the
// English one), but this script's onConflictDoNothing target was never
// updated to match. Postgres's ON CONFLICT can only target a constraint
// that actually exists, so every run since round 90 has thrown
// "there is no unique or exclusion constraint matching the ON CONFLICT
// specification" instead of silently no-op'ing on a re-run as intended --
// found live when round 122's database rebuild wiped every queue row and
// this script was needed to restore the 5 blog posts. Fixed to the real
// 3-column constraint.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getDb } from "../src/lib/db/client";
import { marketingQueue } from "../src/lib/db/schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "updates");

async function main() {
  const db = getDb();
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const rows = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data } = matter(raw);
    const sources: Array<{ title: string; url: string }> = Array.isArray(data.sources) ? data.sources : [];
    return {
      channel: "blog" as const,
      mode: "auto_post" as const,
      destination: `/updates/${slug}`,
      draftText: `${data.title}\n\n${data.summary}`,
      sourceCitations: sources.map((s) => `${s.title}: ${s.url}`).join("; "),
      guardrailNotes: "Round 93 seed post, pre-checked against SOCIAL_MEDIA_GUARDRAILS.md per claude_updates-seed-posts (no case-specific guidance, no identifying detail beyond the founder's own pre-approved story, no product-state overclaim, no policy advocacy).",
      status: "pending" as const,
    };
  });

  await db.insert(marketingQueue).values(rows).onConflictDoNothing({
    target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale],
  });
  console.log(`Seeded ${rows.length} blog queue rows (existing ones left untouched).`);
  process.exit(0);
}

main();
