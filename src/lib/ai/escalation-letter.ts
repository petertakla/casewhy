// CW-39, Part B — letter/request drafting. Reuses the same AI-drafting
// infrastructure and legal-framing rule already proven in CW-32 (chat)
// and CW-40 (attorney report): organize and format the user's own
// content, never invent new case-specific claims. Same adversarial-
// testing bar as CW-32 applies here — see CLOUD_CLAUDE.md for how that
// was verified for chat; this surface needs the same discipline before
// being trusted as "done."

import { generateText } from "ai";
import type { CaseStatus } from "@/lib/uscis/client";
import type { RepresentativeEntry } from "@/lib/congress/representatives";
import type { MailingAddress } from "@/lib/congress/mailing-address";

export type LetterType = "congressional" | "field_office" | "ombudsman";

const LETTER_PURPOSE: Record<LetterType, string> = {
  congressional:
    "a formal constituent-services inquiry letter from the applicant to their U.S. Representative's or Senator's office, asking the office to make a status inquiry with USCIS on the applicant's behalf — a standard, routine constituent service request",
  field_office:
    "a formal written follow-up letter to the applicant's local USCIS field office, requesting an update on the case's current status and next steps",
  ombudsman:
    "a formal USCIS Ombudsman Case Assistance request, describing the case's delay and asking the Ombudsman's office to look into it",
};

const SYSTEM_INSTRUCTIONS = `You are CaseWhy's escalation-letter drafting assistant. You organize and format facts and reasons the user gives you into a properly formatted formal letter.

Hard rules:
- Never invent case-specific facts, claims, predictions, or legal arguments the user didn't provide. Every factual claim about the case (receipt number, filing date, status, dates) must come only from the structured case data given to you. Every claim about why the delay matters must come only from the user's own stated reason — if it's vague, keep the letter's language similarly general rather than inventing specifics.
- Never state or imply a legal conclusion, a guaranteed outcome, or that this letter (or CaseWhy) has any official status.
- Never claim CaseWhy is affiliated with, endorsed by, or acting on behalf of USCIS, DHS, or any government office.
- Output only the finished letter text, ready to copy and send — no commentary, no markdown formatting, no explanation of what you did, no placeholder brackets left unfilled (if a detail is genuinely missing, write around it naturally rather than inserting a bracket).`;

export interface DraftLetterInput {
  letterType: LetterType;
  status: CaseStatus;
  userReason: string;
  address: MailingAddress;
  representative?: RepresentativeEntry;
}

export async function draftEscalationLetter(input: DraftLetterInput): Promise<string> {
  const { letterType, status, userReason, address, representative } = input;

  const caseFacts = [
    `Form type: ${status.formType}`,
    `Receipt number: ${status.receiptNumber}`,
    status.submittedDate ? `Filed: ${status.submittedDate}` : null,
    `Current status: ${status.statusText}`,
    status.modifiedDate ? `Status last updated: ${status.modifiedDate}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const recipientLine =
    letterType === "congressional" && representative
      ? `Recipient: ${representative.name}'s office (${
          representative.chamber === "senate" ? "U.S. Senator" : "U.S. Representative"
        }, ${representative.state}${representative.district ? `-${representative.district}` : ""})`
      : "";

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    instructions: SYSTEM_INSTRUCTIONS,
    prompt: `Write ${LETTER_PURPOSE[letterType]}.

Sender: ${address.fullName}
${address.street}, ${address.city}, ${address.state} ${address.zip}
${recipientLine}

Case facts (use only these — do not invent additional facts):
${caseFacts}

The applicant's own stated reason this delay matters to them (use only this — do not invent additional reasons or elaborate beyond what's given):
"${userReason}"

Write the complete letter now.`,
  });

  return text;
}
