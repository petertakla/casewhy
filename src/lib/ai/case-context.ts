// Shared case-fact grounding, used by both explainCaseStatus() and the CW-32
// chat — extracted once both needed the identical set of facts (form type,
// processing center, dates, history, matched policy background), rather than
// duplicating this between the two.

import type { CaseStatus } from "@/lib/uscis/client";
import { findRelevantPolicyContext, type PolicyMemo } from "@/lib/kb/policy-memos";

// Service center inferred from the receipt number's 3-letter prefix. This is
// USCIS's own long-published convention (see USCIS's "how to read your
// receipt number" guidance), not something CaseWhy is inferring — only
// prefixes confirmed against that guidance are listed. An unrecognized
// prefix (including "IOE", which spans multiple physical centers) is simply
// omitted from the prompt rather than guessed. Note: USCIS's own processing-
// times tool is separately mid-transition toward a consolidated "Service
// Center Operations (SCOPS)" bucket for *reporting* purposes (see
// src/lib/kb/processing-times.ts) — this doesn't affect the historical
// center names below, which still appear on real correspondence.
const SERVICE_CENTERS: Record<string, string> = {
  EAC: "Vermont Service Center",
  WAC: "California Service Center",
  LIN: "Nebraska Service Center",
  SRC: "Texas Service Center",
  MSC: "National Benefits Center",
  NBC: "National Benefits Center",
  YSC: "Potomac Service Center",
};

function serviceCenter(receiptNumber: string): string | undefined {
  return SERVICE_CENTERS[receiptNumber.slice(0, 3).toUpperCase()];
}

/** Whole days between two parseable date strings, or null if either fails to parse. */
function daysBetween(earlier: string, later: string): number | null {
  const a = new Date(earlier).getTime();
  const b = new Date(later).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export interface CaseContext {
  /** Plain-text case facts, ready to drop into a model prompt. Deliberately omits the raw receipt number — nothing here needs it beyond the processing center already derived from it. */
  promptText: string;
  /** Deterministically matched — see findRelevantPolicyContext(). Never model-generated, safe to render as citations. */
  relatedPolicies: Pick<PolicyMemo, "id" | "title" | "sourceTitle" | "sourceUrl">[];
}

export function buildCaseContext(status: CaseStatus): CaseContext {
  const center = serviceCenter(status.receiptNumber);
  const today = new Date().toISOString().slice(0, 10);
  const daysAtCurrentStatus = status.modifiedDate ? daysBetween(status.modifiedDate, today) : null;
  const daysSinceFiling = status.submittedDate ? daysBetween(status.submittedDate, today) : null;

  const historyText = status.history.map((h) => h.completed_text_en).join(" ");
  const relatedPolicies = findRelevantPolicyContext({
    formType: status.formType,
    statusText: status.statusText,
    statusDescription: status.statusDescription,
    historyText,
    submittedDate: status.submittedDate,
  });

  const promptText = [
    `Form type: ${status.formType}`,
    center && `Processing center: ${center}`,
    status.submittedDate && `Filed: ${status.submittedDate}${daysSinceFiling !== null ? ` (${daysSinceFiling} days ago)` : ""}`,
    `Current status: ${status.statusText}`,
    `Description: ${status.statusDescription}`,
    status.modifiedDate &&
      `Status last updated: ${status.modifiedDate}${daysAtCurrentStatus !== null ? ` (${daysAtCurrentStatus} days ago)` : ""}`,
    status.history.length > 0 &&
      `Full status history for this case, each entry dated (order as returned by USCIS, not guaranteed chronological — read the dates):\n${status.history
        .map((h) => `- ${h.date}: ${h.completed_text_en}`)
        .join("\n")}`,
    relatedPolicies.length > 0 &&
      `Possibly relevant policy background (this is general context that plausibly, not definitely, applies — USCIS's status text never confirms why a case is delayed, and there's no way to confirm a policy applies to this specific case, e.g. nationality is never known. If used, frame it explicitly as something the user could ask an attorney about — never state or imply it explains this case's status as fact):\n${relatedPolicies
        .map((p) => `- ${p.title}: ${p.summary} Current status: ${p.currentStatus}`)
        .join("\n")}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return {
    promptText,
    relatedPolicies: relatedPolicies.map(({ id, title, sourceTitle, sourceUrl }) => ({
      id,
      title,
      sourceTitle,
      sourceUrl,
    })),
  };
}
