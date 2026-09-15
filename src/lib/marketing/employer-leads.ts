// Round 94 — casewhyhub.com/employers' backend. Same shape as
// src/lib/marketing/subscribe.ts (round 6/7's "Notify me" form handler):
// a honeypot check, a DB insert, and a best-effort admin notification
// that never blocks the response to the visitor if Postmark itself fails.

import { z } from "zod";
import { getDb } from "../db/client";
import { employerLeads } from "../db/schema";
import { sendEmployerLeadNotification } from "../email/postmark";

const EmployerLeadInput = z.object({
  company: z.string().trim().min(1).max(200),
  teamSize: z.string().trim().min(1).max(20),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  needs: z.string().trim().max(2000).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
});

export interface EmployerLeadResult {
  ok: boolean;
  error?: string;
}

export async function submitEmployerLead(input: {
  company: string;
  teamSize: string;
  contactName: string;
  email: string;
  needs?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  website?: string; // honeypot
}): Promise<EmployerLeadResult> {
  if (input.website) {
    // Honeypot tripped — report success without writing anything, same
    // "don't tell a bot its submission was rejected" logic as subscribe.ts.
    return { ok: true };
  }

  const parsed = EmployerLeadInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in the required fields with a valid email address." };
  }

  const db = getDb();
  await db.insert(employerLeads).values({
    company: parsed.data.company,
    teamSize: parsed.data.teamSize,
    contactName: parsed.data.contactName,
    email: parsed.data.email,
    needs: parsed.data.needs || null,
    utmSource: parsed.data.utmSource || null,
    utmMedium: parsed.data.utmMedium || null,
    utmCampaign: parsed.data.utmCampaign || null,
  });

  try {
    await sendEmployerLeadNotification({
      company: parsed.data.company,
      teamSize: parsed.data.teamSize,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      needs: parsed.data.needs,
    });
  } catch (err) {
    // The lead is already saved -- a Postmark failure shouldn't turn into
    // a false error for the visitor, or lose the lead. Logged, not thrown.
    console.error("[employer-leads] notification failed:", err);
  }

  return { ok: true };
}
