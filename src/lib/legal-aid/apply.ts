// Round 34 — shared application-submission logic for the legal-aid
// self-enroll form (/legal-aid/join), used by the "use server" wrapper in
// src/app/legal-aid/join/actions.ts. Mirrors
// src/lib/accredited-representatives/apply.ts's shape: zod validation, a
// CSS-hidden honeypot, insert-and-report-success-either-way so a bot can't
// learn its submission was rejected.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { legalAidApplications } from "@/lib/db/schema";
import { sendLegalAidApplicationNotification } from "@/lib/email/postmark";

const ApplicationInput = z.object({
  organizationName: z.string().trim().min(1, "Enter your organization's name.").max(200),
  orgType: z.string().trim().min(1, "Describe your organization type.").max(200),
  contactPerson: z.string().trim().min(1, "Enter a contact person's name.").max(200),
  statesServed: z.string().trim().min(1, "Enter the states or regions you serve.").max(200),
  populationServed: z.string().trim().min(1, "Describe the population you serve.").max(300),
  servicesOffered: z.string().trim().min(1, "Describe the services you offer.").max(500),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function submitLegalAidApplication(input: {
  organizationName: string;
  orgType: string;
  contactPerson: string;
  statesServed: string;
  populationServed: string;
  servicesOffered: string;
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
  await db.insert(legalAidApplications).values({
    organizationName: parsed.data.organizationName,
    orgType: parsed.data.orgType,
    contactPerson: parsed.data.contactPerson,
    statesServed: parsed.data.statesServed,
    populationServed: parsed.data.populationServed,
    servicesOffered: parsed.data.servicesOffered,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
  });

  // Best-effort — a Postmark hiccup shouldn't fail a real applicant's
  // submission, which already landed in the DB above.
  try {
    await sendLegalAidApplicationNotification({
      organizationName: parsed.data.organizationName,
      orgType: parsed.data.orgType,
      contactPerson: parsed.data.contactPerson,
      statesServed: parsed.data.statesServed,
      populationServed: parsed.data.populationServed,
      servicesOffered: parsed.data.servicesOffered,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
    });
  } catch (err) {
    console.error("Failed to send legal-aid-application notification email", err);
  }

  return { ok: true };
}
