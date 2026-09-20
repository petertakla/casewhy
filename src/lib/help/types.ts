// Round 124 — the one shared content shape both a public Help Center and
// the admin How-To guide render from, so "reusable for both general users
// and the admin user" (Peter's own framing, extending round 120's
// admin-only ask) is real shared code, not just a similar look.
//
// `answer` stays ReactNode rather than a plain string specifically so
// round 104's existing FAQ content (several answers are JSX with real
// inline <Link>s, not plain text) could map into this shape without losing
// fidelity, if a future round chooses to render FAQ content through these
// same components. This round doesn't do that itself — see
// src/app/help/page.tsx's own comment for why linking to /faq was chosen
// over embedding it this time.

import type { ReactNode } from "react";

export type HelpAudience = "public" | "admin";
export type HelpKind = "faq" | "howto";

export interface HelpEntry {
  id: string;
  title: string;
  /** Section heading this entry renders under. */
  group: string;
  audience: HelpAudience;
  kind: HelpKind;
  /** kind: 'faq' */
  answer?: ReactNode;
  /** kind: 'howto' */
  steps?: string[];
  notes?: string[];
  /** Live link to the real page this entry describes. Required in practice
   * for 'howto' entries (the "with links" requirement, round 120/124) —
   * optional for 'faq' since not every question maps to one page. */
  href?: string;
}
