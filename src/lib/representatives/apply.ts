// Round 29 — shared application-submission logic for the accredited-
// representatives self-enroll form (/representatives/join), used by the
// "use server" wrapper in src/app/representatives/join/actions.ts. Mirrors
// src/lib/marketing/subscribe.ts's shape: zod validation, a CSS-hidden
// honeypot (not type="hidden", which a form-filling bot would recognize and
// skip), insert-and-report-success-either-way so a bot can't learn its
// submission was rejected.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { representativeApplications } from "@/lib/db/schema";
import { sendRepresentativeApplicationNotification } from "@/lib/email/postmark";

const ApplicationInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  organization: z.string().trim().min(1, "Enter your organization's name.").max(200),
  accreditationDetails: z
    .string()
    .trim()
    .min(1, "Describe your DOJ accreditation.")
    .max(500),
  statesServed: z.string().trim().min(1, "Enter the states or regions you serve.").max(200),
  practiceFocus: z.string().trim().min(1, "Enter your practice focus.").max(300),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function submitRepresentativeApplication(input: {
  name: string;
  organization: string;
  accreditationDetails: string;
  statesServed: string;
  practiceFocus: string;
  contactEmail: string;
  contactPhone?: string;
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

  const db = getDb();
  await db.insert(representativeApplications).values({
    name: parsed.data.name,
    organization: parsed.data.organization,
    accreditationDetails: parsed.data.accreditationDetails,
    statesServed: parsed.data.statesServed,
    practiceFocus: parsed.data.practiceFocus,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
  });

  // Best-effort — a Postmark hiccup shouldn't fail a real applicant's
  // submission, which already landed in the DB above. Peter can still see
  // it there even if the alert email itself doesn't go out.
  try {
    await sendRepresentativeApplicationNotification({
      name: parsed.data.name,
      organization: parsed.data.organization,
      accreditationDetails: parsed.data.accreditationDetails,
      statesServed: parsed.data.statesServed,
      practiceFocus: parsed.data.practiceFocus,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
    });
  } catch (err) {
    console.error("Failed to send representative-application notification email", err);
  }

  return { ok: true };
}
