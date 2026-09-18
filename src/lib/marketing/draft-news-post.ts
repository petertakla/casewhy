// Round 90 — drafts an X thread and a Threads post from a real watcher
// item (src/lib/marketing/news-watcher/), reusing the guardrails-prompt
// shape draft-marketing-reply.ts established in round 73/89, adapted for:
// this channel's own content (the news item itself, not CaseWhy's KB) and
// SOCIAL_MEDIA_GUARDRAILS.md Section 4's specific instruction for
// LinkedIn/X/Threads — "sourcing over speed," a wrong or unsourced fast
// take costs more credibility than staying quiet a day longer.
//
// Every watcher source is a primary source itself (a .gov feed/page, not
// an aggregator) — see news-watcher/sources.ts's own note on why
// CourtListener/AILA were left out specifically to avoid this ever being
// ambiguous. So "can't identify a primary source" (the task doc's
// escalation trigger) reduces here to "the model couldn't produce a
// substantive, honest reaction to this specific item" (CANNOT_DRAFT) —
// still checked and still escalates, just via one path instead of two.
//
// LINKS_ENABLED simplification: draft-marketing-reply.ts (round 73) runs a
// real two-pass "answer before a pitch" test because it sometimes needs to
// decide whether an already-included CaseWhy mention was load-bearing.
// That machinery isn't needed here while LINKS_ENABLED is false (round 96
// flips it) -- the instructions below simply forbid any CaseWhy mention at
// all in that state, so there's never a mention to test. When a future
// round flips LINKS_ENABLED on, this file should get the same two-pass
// upgrade draft-marketing-reply.ts already has, not before.

import { generateText } from "ai";
import { LINKS_ENABLED } from "./config";

export type NewsChannel = "x" | "threads" | "facebook";
export type DraftLocale = "en" | "es";

export interface NewsDraftResult {
  /** X: array of 2-6 thread posts (source citation already inserted as post index 1). Threads: array of exactly 1 post. */
  posts: string[];
}

interface NewsItemInput {
  title: string;
  rawSummary: string;
  sourceName: string;
  url: string;
}

function baseInstructions(item: NewsItemInput, linksEnabled: boolean, locale: DraftLocale): string {
  const lang =
    locale === "es"
      ? "Write entirely in formal (usted) Spanish, not a translation of an English draft — generate it directly in Spanish from the facts below."
      : "Write in English.";
  return `You're drafting a proposed social post for Peter, CaseWhy's founder, to review before it ever goes anywhere -- nothing you write is posted automatically, and this exact text is what he sees in the approval queue. CaseWhy is a free USCIS case-status tracking app Peter built; it is never a law firm and never gives legal advice.

Hard rules, no exceptions (SOCIAL_MEDIA_GUARDRAILS.md):
- Procedural and factual only -- explain what changed and who it affects generically ("applicants filing X after this date..."), never advocacy or a position on immigration policy itself, never "you should."
- Never state a fact not present in the source material given below. If the source material doesn't give you enough to write something substantive and accurate, say so (start your reply with "CANNOT_DRAFT:" followed by why) rather than pad it out.
- Never read as legal advice, an official USCIS position, or a guaranteed outcome/timeline.
- ${linksEnabled ? 'If you mention CaseWhy, include a plain, upfront disclosure that Peter built it ("full disclosure, I built it").' : "Do not mention CaseWhy, or any product, at all -- product mentions are disabled for this draft."}
- ${lang}
- Match the tone of someone knowledgeable giving a fast, careful, sourced take -- not marketing copy, not a press release.

Source material (this is the ONLY factual basis you may use):
Title: ${item.title}
Source: ${item.sourceName}
Summary: ${item.rawSummary || "(no summary provided by the source feed -- work from the title alone, and say CANNOT_DRAFT if that's not enough to be substantive)"}`;
}

async function generateOnce(instructions: string, userPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions,
    messages: [{ role: "user", content: userPrompt }],
  });
  return text.trim();
}

export async function draftXThread(item: NewsItemInput, locale: DraftLocale = "en"): Promise<NewsDraftResult | null> {
  const instructions = `${baseInstructions(item, LINKS_ENABLED, locale)}

Format: write 2 to 5 short posts (each under 260 characters, X/Twitter style) as a thread -- post 1 is a hook stating what changed, posts 2+ explain who it affects and any concrete detail worth knowing. Do NOT write a source/citation post yourself -- that's inserted separately. Output ONLY the posts, one per line, separated by a line containing exactly "---" and nothing else. No numbering, no post count preamble.`;

  const raw = await generateOnce(instructions, `Draft the X thread now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;

  const posts = raw
    .split(/\n\s*---\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (posts.length < 1) return null;

  const citation = locale === "es" ? `Fuente: ${item.sourceName} — ${item.url}` : `Source: ${item.sourceName} — ${item.url}`;
  // Source link as the first reply (task doc's own wording) -- inserted
  // deterministically at index 1, not left to the model, so it's never
  // missing, never malformed, and never counted against the model's own
  // "don't state facts outside the source" instruction.
  const withCitation = [posts[0], citation, ...posts.slice(1)];
  return { posts: withCitation.slice(0, 6) };
}

export async function draftThreadsPost(item: NewsItemInput, locale: DraftLocale = "en"): Promise<NewsDraftResult | null> {
  const instructions = `${baseInstructions(item, LINKS_ENABLED, locale)}

Format: write ONE longer post (under 480 characters, Threads style) covering what changed, who it affects, and one concrete procedural detail. Output only the post text, nothing else.`;

  const raw = await generateOnce(instructions, `Draft the Threads post now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;
  if (!raw) return null;

  const citation = locale === "es" ? `Fuente: ${item.sourceName} — ${item.url}` : `Source: ${item.sourceName} — ${item.url}`;
  return { posts: [`${raw}\n\n${citation}`] };
}

// Round 90 follow-up (Sep 18) — Facebook Page post. Longer than Threads
// (a Page update reads more like a short paragraph than a quick take),
// still one post, same citation-appended shape as draftThreadsPost.
export async function draftFacebookPost(item: NewsItemInput, locale: DraftLocale = "en"): Promise<NewsDraftResult | null> {
  const instructions = `${baseInstructions(item, LINKS_ENABLED, locale)}

Format: write ONE Facebook Page post (under 800 characters) covering what changed, who it affects, and enough concrete procedural detail to be genuinely useful on its own. Slightly more explanatory than a Threads post -- Facebook Page followers expect a bit more context, not just a quick take. Output only the post text, nothing else.`;

  const raw = await generateOnce(instructions, `Draft the Facebook Page post now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;
  if (!raw) return null;

  const citation = locale === "es" ? `Fuente: ${item.sourceName} — ${item.url}` : `Source: ${item.sourceName} — ${item.url}`;
  return { posts: [`${raw}\n\n${citation}`] };
}
