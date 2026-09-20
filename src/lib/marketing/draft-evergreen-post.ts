// Round 116 — drafts an X thread/Threads post/Facebook post from an
// evergreen educational topic (src/lib/marketing/evergreen/topics.ts),
// not a reacting-to-news item. Reuses draft-news-post.ts's exact
// guardrail shape (SOCIAL_MEDIA_GUARDRAILS.md Section 4: procedural/
// factual only, sourced only from the facts given, no CaseWhy mention
// while LINKS_ENABLED is false, cite the source) -- the only real
// difference is the framing sentence ("explain a topic that's always
// true" instead of "react to what just changed") and that a citation is
// always appended (evergreen topics don't have a single news URL to
// insert as a separate reply post the way draftXThread does).
//
// Why a second file instead of a shared one: draft-news-post.ts's own
// header already documents why it doesn't need draft-marketing-reply.ts's
// two-pass CaseWhy-mention test while LINKS_ENABLED is false. The same
// simplification applies here. If a future round adds real per-post CTAs
// once LINKS_ENABLED flips, both files should get that upgrade together,
// not before.

import { generateText } from "ai";
import { LINKS_ENABLED } from "./config";

export interface EvergreenDraftResult {
  /** X: array of 2-5 thread posts (citation appended to the last post). Threads/Facebook: array of exactly 1 post. */
  posts: string[];
}

export interface EvergreenItemInput {
  title: string;
  facts: string;
  sourceName: string;
  /** Omitted for the Friday recap -- it summarizes CaseWhy's own week of posts, not an external primary source, so there's nothing to cite. */
  sourceUrl?: string;
}

function baseInstructions(item: EvergreenItemInput): string {
  return `You're drafting a proposed social post for Peter, CaseWhy's founder, to review before it ever goes anywhere -- nothing you write is posted automatically, and this exact text is what he sees in the approval queue. CaseWhy is a free USCIS case-status tracking app Peter built; it is never a law firm and never gives legal advice. This is an evergreen educational post (not reacting to breaking news) explaining something that's genuinely useful to know right now.

Hard rules, no exceptions (SOCIAL_MEDIA_GUARDRAILS.md):
- Procedural and factual only -- explain what this means and who it affects generically ("applicants filing X..."), never advocacy or a position on immigration policy itself, never "you should."
- Never state a fact not present in the facts given below. If they don't give you enough to write something substantive and accurate, say so (start your reply with "CANNOT_DRAFT:" followed by why) rather than pad it out.
- Never read as legal advice, an official USCIS position, or a guaranteed outcome/timeline.
- ${linkInstruction()}
- Write in English.
- Match the tone of someone knowledgeable explaining something clearly -- not marketing copy, not a press release.

Topic: ${item.title}
Facts (this is the ONLY factual basis you may use):
${item.facts}`;
}

function linkInstruction(): string {
  return LINKS_ENABLED
    ? 'If you mention CaseWhy, include a plain, upfront disclosure that Peter built it ("full disclosure, I built it").'
    : "Do not mention CaseWhy, or any product, at all -- product mentions are disabled for this draft.";
}

async function generateOnce(instructions: string, userPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions,
    messages: [{ role: "user", content: userPrompt }],
  });
  return text.trim();
}

function citationFor(item: EvergreenItemInput): string | null {
  return item.sourceUrl ? `Source: ${item.sourceName} — ${item.sourceUrl}` : null;
}

export async function draftEvergreenXThread(item: EvergreenItemInput): Promise<EvergreenDraftResult | null> {
  const instructions = `${baseInstructions(item)}

Format: write 2 to 4 short posts (each under 260 characters, X/Twitter style) as a thread -- post 1 is a hook stating the topic plainly, posts 2+ explain the detail and who it affects. Output ONLY the posts, one per line, separated by a line containing exactly "---" and nothing else. No numbering, no post count preamble.`;

  const raw = await generateOnce(instructions, `Draft the X thread now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;

  const posts = raw
    .split(/\n\s*---\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (posts.length < 1) return null;

  // Citation appended as the thread's own last post (not inserted as post
  // index 1 the way draftXThread does for news) -- evergreen topics cite
  // CaseWhy's own KB source, background context rather than "here's the
  // primary document this reacts to," so it reads more naturally last.
  // Omitted entirely for the Friday recap (no single external source).
  const citation = citationFor(item);
  return { posts: (citation ? [...posts, citation] : posts).slice(0, 5) };
}

export async function draftEvergreenThreadsPost(item: EvergreenItemInput): Promise<EvergreenDraftResult | null> {
  const instructions = `${baseInstructions(item)}

Format: write ONE longer post (under 480 characters, Threads style) covering the topic and one concrete procedural detail. Output only the post text, nothing else.`;

  const raw = await generateOnce(instructions, `Draft the Threads post now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;
  if (!raw) return null;

  const citation = citationFor(item);
  return { posts: [citation ? `${raw}\n\n${citation}` : raw] };
}

export async function draftEvergreenFacebookPost(item: EvergreenItemInput): Promise<EvergreenDraftResult | null> {
  const instructions = `${baseInstructions(item)}

Format: write ONE Facebook Page post (under 800 characters) covering the topic with enough concrete procedural detail to be genuinely useful on its own. Slightly more explanatory than a Threads post -- Facebook Page followers expect a bit more context. Output only the post text, nothing else.`;

  const raw = await generateOnce(instructions, `Draft the Facebook Page post now.`);
  if (raw.startsWith("CANNOT_DRAFT:")) return null;
  if (!raw) return null;

  const citation = citationFor(item);
  return { posts: [citation ? `${raw}\n\n${citation}` : raw] };
}
