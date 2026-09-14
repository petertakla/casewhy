// Round 86 (urgent, Sep 14) — shared logic for one run of the sandbox
// volume-test plan (uscis-sandbox-volume-test-plan.md), used by both
// /api/cron/uscis-volume-test (the deployed, externally-scheduled route)
// and scripts/uscis-volume-run.ts (a standalone runner against local
// credentials). One run = ~50 calls (~30 success, ~20 error), paced
// ~1-1.5s apart.
//
// CORRECTION, Sep 14: the plan and an earlier CLOUD_CLAUDE.md note assumed
// the sandbox mocks *any* well-formed receipt number. A real first run
// against a large batch of randomly-generated valid-prefix numbers came
// back 100% 404 — that assumption was wrong (the one documented match,
// LIN0000000000, was apparently a coincidental hit on a specific pool
// entry, not evidence of a universal rule). Probed a grid of prefix x
// round-digit-pattern combinations live and confirmed the sandbox actually
// serves a small, curated pool of specific (prefix, digits) pairs, not an
// arbitrary space. CONFIRMED_SUCCESS_RECEIPTS below are the 12 combos that
// verifiably returned a real 200 with real mock data (7 different form
// types, several different status texts) — cycle through these for the
// "success" side instead of generating random digits. Getting this wrong
// silently would have meant running hundreds of calls that all 404'd,
// which looks like a broken client hammering invalid lookups, not
// realistic distributed usage — the opposite of the point of this plan.

import { getCaseStatus, UscisApiError } from "./client";

export const CONFIRMED_SUCCESS_RECEIPTS = [
  "EAC9999103403", // I-130, "Case Was Approved"
  "WAC0000000000", // I-131, "Withdrawal Acknowledgement Notice Was Sent"
  "WAC9999999999", // I-751, "Case Was Received At My Local Office"
  "WAC1234567890", // I-129, "Request For Premium Processing Services Was Received"
  "WAC0000000001", // I-751, "Case Was Transferred And A New Office Has Jurisdiction"
  "LIN0000000000", // I-751, "Case Was Received At My Local Office"
  "SRC0000000000", // I-765, "Case Was Received"
  "MSC0000000000", // I-485, "Case Accepted By The USCIS Lockbox"
  "YSC0000000000", // I-751, "Case Accepted By The USCIS Lockbox"
  "YSC0000000001", // I-140G, "Biometrics Appointment Was Scheduled"
  "IOE9999999999", // OS155A, "Case Accepted By The USCIS Lockbox"
  "IOE1234567890", // I-765, "Case Was Approved"
];

export const SUCCESS_CALLS = 30;
export const ERROR_CALLS = 20;
const PACE_MS_MIN = 1000;
const PACE_MS_MAX = 1500;

function randomDigits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function randomSuccessReceipt(): string {
  return CONFIRMED_SUCCESS_RECEIPTS[Math.floor(Math.random() * CONFIRMED_SUCCESS_RECEIPTS.length)];
}

// Rotates through genuinely different malformed shapes each call, not one
// fixed bad value reused every time. Different shapes reliably produce
// different real error codes (404 for an unrecognized-but-valid-shaped
// prefix, 422 for a too-short/too-long/wrong-format receipt) per this
// project's own repeated live testing (Days 2-5 of the first attempt, and
// this round's own probe).
function randomInvalidReceipt(callIndex: number): string {
  const shape = callIndex % 4;
  if (shape === 0) return `ZZZ${randomDigits(10)}`; // unrecognized prefix, valid length
  if (shape === 1) return `EAC${randomDigits(6)}`; // valid prefix, too short
  if (shape === 2) return `EAC${randomDigits(14)}`; // valid prefix, too long
  return `1${randomDigits(2)}${randomDigits(10)}`; // digits where the prefix should be
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface VolumeTestRunResult {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  statusCodes: Record<string, number>;
  quotaHit: boolean;
  unexpectedErrors: string[];
  durationMs: number;
}

export async function runOneVolumeTestBatch(): Promise<VolumeTestRunResult> {
  const startedAt = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const statusCodes: Record<string, number> = {};
  let quotaHit = false;
  const unexpectedErrors: string[] = [];

  const calls: string[] = [];
  for (let i = 0; i < SUCCESS_CALLS; i++) calls.push(randomSuccessReceipt());
  for (let i = 0; i < ERROR_CALLS; i++) calls.push(randomInvalidReceipt(i));
  for (let i = calls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [calls[i], calls[j]] = [calls[j], calls[i]];
  }

  for (const receiptNumber of calls) {
    try {
      await getCaseStatus(receiptNumber);
      successCount++;
      statusCodes["200"] = (statusCodes["200"] ?? 0) + 1;
    } catch (err) {
      if (err instanceof UscisApiError) {
        errorCount++;
        statusCodes[String(err.status)] = (statusCodes[String(err.status)] ?? 0) + 1;
        if (err.status === 429) quotaHit = true;
      } else {
        unexpectedErrors.push(err instanceof Error ? err.message : String(err));
      }
    }
    await sleep(PACE_MS_MIN + Math.random() * (PACE_MS_MAX - PACE_MS_MIN));
  }

  return {
    totalCalls: calls.length,
    successCount,
    errorCount,
    statusCodes,
    quotaHit,
    unexpectedErrors,
    durationMs: Date.now() - startedAt,
  };
}
