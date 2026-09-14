// Round 93 — one-time seed of marketing_queue rows for the 5 seed
// /updates posts, so Peter can review/approve each one in
// /admin/marketing before it goes live (channel=blog is gated: see
// src/lib/updates/updates.ts). Safe to re-run: onConflictDoNothing keyed
// on the (channel, destination) unique constraint, same pattern as
// seed-email-alias-configs.ts.

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
    target: [marketingQueue.channel, marketingQueue.destination],
  });
  console.log(`Seeded ${rows.length} blog queue rows (existing ones left untouched).`);
  process.exit(0);
}

main();
