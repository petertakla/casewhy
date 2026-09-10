// Round 28 — shared application-submission logic for the attorney
// self-enroll form (/attorneys/join), used by the "use server" wrapper in
// src/app/attorneys/join/actions.ts. Mirrors
// src/lib/accredited-representatives/apply.ts's shape exactly (which itself mirrors
// src/lib/marketing/subscribe.ts): zod validation, a CSS-hidden honeypot,
// insert-and-report-success-either-way so a bot can't learn its submission
// was rejected.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { attorneyApplications } from "@/lib/db/schema";
import { sendAttorneyApplicationNotification } from "@/lib/email/postmark";
import { screenForDiscipline } from "@/lib/discipline/screen";

const ApplicationInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  firm: z.string().trim().min(1, "Enter your firm's name.").max(200),
  statesLicensed: z.string().trim().min(1, "Enter the state(s) you're licensed in.").max(200),
  barNumber: z.string().trim().min(1, "Enter your bar number.").max(100),
  practiceAreas: z.string().trim().min(1, "Enter your practice areas.").max(300),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  // Round 40 — optional; the applicant obviously knows their own site.
  websiteUrl: z.string().trim().max(300).optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function submitAttorneyApplication(input: {
  name: string;
  firm: string;
  statesLicensed: string;
  barNumber: string;
  practiceAreas: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  website?: string;
}): Promise<ApplyResult> {
  const parsed = ApplicationInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (parsed.data.website) {
    // Honeypot tripped — report success without writing anything.
    return { ok: true };
  }

  // Round 59 — screened before insert so the match note lands in the same
  // row as the application it's about, not a separate lookup later.
  const disciplineMatchNote = await screenForDiscipline(parsed.data.name, parsed.data.statesLicensed);

  const db = getDb();
  await db.insert(attorneyApplications).values({
    name: parsed.data.name,
    firm: parsed.data.firm,
    statesLicensed: parsed.data.statesLicensed,
    barNumber: parsed.data.barNumber,
    practiceAreas: parsed.data.practiceAreas,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
    websiteUrl: parsed.data.websiteUrl || null,
    disciplineMatchNote,
  });

  // Best-effort — see src/lib/accredited-representatives/apply.ts for the same
  // reasoning: a Postmark hiccup shouldn't fail a submission that already
  // landed in the DB.
  try {
    await sendAttorneyApplicationNotification({
      name: parsed.data.name,
      firm: parsed.data.firm,
      statesLicensed: parsed.data.statesLicensed,
      barNumber: parsed.data.barNumber,
      practiceAreas: parsed.data.practiceAreas,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      websiteUrl: parsed.data.websiteUrl,
      disciplineMatchNote,
    });
  } catch (err) {
    console.error("Failed to send attorney-application notification email", err);
  }

  return { ok: true };
}
