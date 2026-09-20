// Round 124 — maps the admin nav registry's own howTo content (round 120)
// into the shared HelpEntry shape, so /admin/how-to renders through the
// same components src/app/help/page.tsx uses. Server-only by design (calls
// nothing that needs to run in a browser bundle) — this stays out of
// src/lib/admin/nav.ts itself since that file is deliberately client-safe.

import { ADMIN_NAV } from "../admin/nav";
import type { HelpEntry } from "./types";

export function getAdminHelpEntries(): HelpEntry[] {
  return ADMIN_NAV.filter((entry) => entry.howTo).map((entry) => ({
    id: entry.href,
    title: entry.label,
    group: entry.group,
    audience: "admin",
    kind: "howto",
    steps: entry.howTo!.steps,
    notes: entry.howTo!.notes,
    href: entry.href,
  }));
}
