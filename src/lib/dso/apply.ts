// Round 43 — shared application-submission logic for the DSO self-enroll
// form (/dso/join), used by the "use server" wrapper in
// src/app/dso/join/actions.ts. Mirrors src/lib/legal-aid/apply.ts's shape.
// This form is the *only* path to a real named DSO contact — DHS's own
// data has none, so a school (or its DSO directly) submitting here is what
// eventually upgrades a machine-seeded, contact-less row into something
// more useful, not just how a brand-new school gets added.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { dsoApplications } from "@/lib/db/schema";
import { sendDsoApplicationNotification } from "@/lib/email/postmark";

const ApplicationInput = z.object({
  schoolName: z.string().trim().min(1, "Enter the school's name.").max(200),
  campusName: z.string().trim().max(200).optional().or(z.literal("")),
  contactName: z.string().trim().min(1, "Enter a contact name.").max(200),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function submitDsoApplication(input: {
  schoolName: string;
  campusName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  notes?: string;
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
  await db.insert(dsoApplications).values({
    schoolName: parsed.data.schoolName,
    campusName: parsed.data.campusName || null,
    contactName: parsed.data.contactName,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
    websiteUrl: parsed.data.websiteUrl || null,
    notes: parsed.data.notes || null,
  });

  try {
    await sendDsoApplicationNotification({
      schoolName: parsed.data.schoolName,
      campusName: parsed.data.campusName,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      websiteUrl: parsed.data.websiteUrl,
      notes: parsed.data.notes,
    });
  } catch (err) {
    console.error("Failed to send DSO-application notification email", err);
  }

  return { ok: true };
}
