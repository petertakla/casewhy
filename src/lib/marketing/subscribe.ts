// Shared email-capture logic, used by both the Next.js app's own
// EmailCaptureForm (via the "use server" wrapper in src/app/actions.ts)
// and the public /api/subscribe route the separate static casewhy.com
// site calls cross-origin — one real backend instead of two.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { emailSubscribers } from "@/lib/db/schema";

const SubscribeInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  sourcePage: z.enum(["landing-hero", "landing-footer", "static-hero", "static-footer"]),
  // Honeypot — a real visitor never sees or fills this field (hidden via
  // CSS, not a "type=hidden" input a form-fill tool would skip over the
  // same way). A bot that fills every field trips this; humans don't.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface SubscribeResult {
  ok: boolean;
  error?: string;
}

export async function subscribeEmail(input: {
  email: string;
  sourcePage: string;
  website?: string;
}): Promise<SubscribeResult> {
  const parsed = SubscribeInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (parsed.data.website) {
    // Honeypot tripped — report success without writing anything, so a
    // bot can't tell its submission was rejected.
    return { ok: true };
  }

  const db = getDb();
  try {
    await db.insert(emailSubscribers).values({
      email: parsed.data.email,
      sourcePage: parsed.data.sourcePage,
    });
  } catch (err) {
    // Postgres unique_violation (23505) — already on the list. Rely on the
    // DB constraint itself rather than a select-then-insert check, which
    // would race under concurrent submissions of the same address.
    // Drizzle wraps the real pg error under `.cause`, not on the thrown
    // error directly — confirmed against a real duplicate-insert error
    // during testing (the top-level error has no `.code` of its own).
    const pgError = err instanceof Error && err.cause instanceof Error ? err.cause : err;
    const isUniqueViolation =
      typeof pgError === "object" &&
      pgError !== null &&
      "code" in pgError &&
      pgError.code === "23505";
    if (!isUniqueViolation) throw err;
  }

  return { ok: true };
}
