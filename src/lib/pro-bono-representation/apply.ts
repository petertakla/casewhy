// Round 58 — shared application-submission logic for the pro bono
// immigration-court representation self-enroll form
// (/pro-bono-representation/join), used by the "use server" wrapper in
// src/app/pro-bono-representation/join/actions.ts. Mirrors
// src/lib/community-orgs/apply.ts's shape.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { proBonoRepresentationApplications } from "@/lib/db/schema";
import { sendProBonoRepresentationApplicationNotification } from "@/lib/email/postmark";

const ApplicationInput = z.object({
  organizationName: z.string().trim().min(1, "Enter your organization's name.").max(200),
  contactPerson: z.string().trim().min(1, "Enter a contact person's name.").max(200),
  immigrationCourtsServed: z.string().trim().min(1, "Enter the immigration court(s) you serve.").max(300),
  languages: z.string().trim().max(200).optional().or(z.literal("")),
  caseTypeLimits: z.string().trim().max(300).optional().or(z.literal("")),
  intakePolicy: z.string().trim().max(300).optional().or(z.literal("")),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(300).optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function submitProBonoRepresentationApplication(input: {
  organizationName: string;
  contactPerson: string;
  immigrationCourtsServed: string;
  languages?: string;
  caseTypeLimits?: string;
  intakePolicy?: string;
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

  const db = getDb();
  await db.insert(proBonoRepresentationApplications).values({
    organizationName: parsed.data.organizationName,
    contactPerson: parsed.data.contactPerson,
    immigrationCourtsServed: parsed.data.immigrationCourtsServed,
    languages: parsed.data.languages || null,
    caseTypeLimits: parsed.data.caseTypeLimits || null,
    intakePolicy: parsed.data.intakePolicy || null,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
    websiteUrl: parsed.data.websiteUrl || null,
  });

  try {
    await sendProBonoRepresentationApplicationNotification({
      organizationName: parsed.data.organizationName,
      contactPerson: parsed.data.contactPerson,
      immigrationCourtsServed: parsed.data.immigrationCourtsServed,
      languages: parsed.data.languages,
      caseTypeLimits: parsed.data.caseTypeLimits,
      intakePolicy: parsed.data.intakePolicy,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      websiteUrl: parsed.data.websiteUrl,
    });
  } catch (err) {
    console.error("Failed to send pro-bono-representation-application notification email", err);
  }

  return { ok: true };
}
