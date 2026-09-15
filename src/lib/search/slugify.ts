// Round 110 — a stable id for anything search needs to deep-link to
// (starting with FAQ questions: /faq#<slugify(question)>). Deriving the
// id from the question text itself, rather than a hand-typed id field on
// each FAQ entry, means the anchor rendered on the page and the id used
// by the search index can never drift apart -- they're computed from the
// same source string by the same function.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (español -> espanol) for a clean URL fragment
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
