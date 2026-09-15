// Round 94 — casewhyhub.com/employers' backend. Same shape as
// src/lib/marketing/subscribe.ts (round 6/7's "Notify me" form handler):
// a honeypot check, a DB insert, and a best-effort admin notification
// that never blocks the response to the visitor if Postmark itself fails.
//
// Round 111 — casewhyhub.com/caseworkers' contact form reuses this same
// function/table with kind: "caseworker" (task doc's own explicit "one
// lead table, don't add a second" instruction), so validation below
// branches on kind: an "employer" row still requires company/teamSize/
// contactName; a "caseworker" row only requires email + a message, with
// name and office both optional (company doubles as "office" for that
// kind, since the two never coexist on one row).

import { z } from "zod";
import { getDb } from "../db/client";
import { employerLeads } from "../db/schema";
import { sendEmployerLeadNotification, sendCaseworkerLeadNotification } from "../email/postmark";

const EmployerLeadInput = z
  .object({
    kind: z.enum(["employer", "caseworker"]).default("employer"),
    company: z.string().trim().max(200).optional(),
    teamSize: z.string().trim().max(20).optional(),
    contactName: z.string().trim().max(200).optional(),
    email: z.string().trim().email().max(320),
    needs: z.string().trim().max(2000).optional(),
    utmSource: z.string().trim().max(100).optional(),
    utmMedium: z.string().trim().max(100).optional(),
    utmCampaign: z.string().trim().max(100).optional(),
  })
  .refine(
    (v) => v.kind !== "employer" || (!!v.company?.trim() && !!v.teamSize?.trim() && !!v.contactName?.trim()),
    { message: "company, teamSize, and contactName are required." }
  )
  .refine((v) => v.kind !== "caseworker" || !!v.needs?.trim(), {
    message: "Please tell us what would help your office.",
  });

export interface EmployerLeadResult {
  ok: boolean;
  error?: string;
}

export async function submitEmployerLead(input: {
  kind?: "employer" | "caseworker";
  company?: string;
  teamSize?: string;
  contactName?: string;
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
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please fill in the required fields." };
  }

  const db = getDb();
  await db.insert(employerLeads).values({
    kind: parsed.data.kind,
    company: parsed.data.company || null,
    teamSize: parsed.data.teamSize || null,
    contactName: parsed.data.contactName || null,
    email: parsed.data.email,
    needs: parsed.data.needs || null,
    utmSource: parsed.data.utmSource || null,
    utmMedium: parsed.data.utmMedium || null,
    utmCampaign: parsed.data.utmCampaign || null,
  });

  try {
    if (parsed.data.kind === "caseworker") {
      await sendCaseworkerLeadNotification({
        contactName: parsed.data.contactName,
        office: parsed.data.company,
        email: parsed.data.email,
        message: parsed.data.needs ?? "",
      });
    } else {
      await sendEmployerLeadNotification({
        company: parsed.data.company!,
        teamSize: parsed.data.teamSize!,
        contactName: parsed.data.contactName!,
        email: parsed.data.email,
        needs: parsed.data.needs,
      });
    }
  } catch (err) {
    // The lead is already saved -- a Postmark failure shouldn't turn into
    // a false error for the visitor, or lose the lead. Logged, not thrown.
    console.error("[employer-leads] notification failed:", err);
  }

  return { ok: true };
}
