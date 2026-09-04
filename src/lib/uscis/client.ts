// USCIS Torch API client — OAuth 2.0 Client Credentials Grant.
//
// Confirmed against developer.uscis.gov/api/case-status docs (Sep 2026):
//   - Sandbox server: https://api-int.uscis.gov/case-status
//   - Sandbox token URL: https://api-int.uscis.gov/oauth/accesstoken
//   - Grant type: client_credentials
//   - Endpoint: GET /{receiptNumber} (receiptNumber is a path param, not a
//     body field — 13 chars, 3 letters + 10 digits, no dashes)
//   - Sandbox only accepts staging receipt numbers (e.g. EAC9999103403);
//     live numbers 404 until production access is granted.
//   - Response shape differs for receipt numbers with an "IOE" prefix (the
//     IOE-Prefix-SuccessResponse schema): submittedDate/modifiedDate are
//     omitted for those — see RawCaseStatus below.

import { getUscisConfig } from "@/lib/config";

const CASE_STATUS_PATH = "/case-status/{receiptNumber}";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const { tokenUrl, clientId, clientSecret } = getUscisConfig();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(
      `USCIS token request failed: ${res.status} ${res.statusText} — ${await res.text()}`
    );
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cachedToken.value;
}

/** Low-level authenticated request against the USCIS API base. Shared by every USCIS API client (Case Status, FOIA, ...). */
export async function uscisRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { apiBase } = getUscisConfig();
  const token = await getAccessToken();

  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init.headers,
    },
  });

  // USCIS docs require handling both 200 and 4xx responses explicitly —
  // this is one of the six things evaluated in the production-access demo.
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new UscisApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

export class UscisApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`USCIS API error ${status}: ${detail}`);
    this.name = "UscisApiError";
  }
}

/** One entry in a case's status history. */
export interface CaseStatusHistoryEntry {
  date: string; // YYYY-MM-DD
  completed_text_en: string;
  completed_text_es: string;
}

/**
 * `case_status` object as returned by the API. `submittedDate` and
 * `modifiedDate` are present for the standard SuccessResponse schema but
 * omitted under IOE-Prefix-SuccessResponse (receiptNumbers starting "IOE").
 */
export interface RawCaseStatus {
  receiptNumber: string;
  formType: string;
  submittedDate?: string;
  modifiedDate?: string;
  current_case_status_text_en: string;
  current_case_status_desc_en: string;
  current_case_status_text_es: string;
  current_case_status_desc_es: string;
  hist_case_status?: CaseStatusHistoryEntry[];
}

interface CaseStatusApiResponse {
  case_status: RawCaseStatus;
  message: string;
}

export interface CaseStatus {
  receiptNumber: string;
  formType: string;
  /** Absent for IOE-prefixed receipt numbers. */
  submittedDate?: string;
  /** Absent for IOE-prefixed receipt numbers. */
  modifiedDate?: string;
  statusText: string;
  statusDescription: string;
  statusTextEs: string;
  statusDescriptionEs: string;
  history: CaseStatusHistoryEntry[];
}

/** Fetch the current status for a single receipt number. */
export async function getCaseStatus(receiptNumber: string): Promise<CaseStatus> {
  const path = CASE_STATUS_PATH.replace("{receiptNumber}", encodeURIComponent(receiptNumber));
  const { case_status: raw } = await uscisRequest<CaseStatusApiResponse>(path);

  return {
    receiptNumber: raw.receiptNumber,
    formType: raw.formType,
    submittedDate: raw.submittedDate,
    modifiedDate: raw.modifiedDate,
    statusText: raw.current_case_status_text_en,
    statusDescription: raw.current_case_status_desc_en,
    statusTextEs: raw.current_case_status_text_es,
    statusDescriptionEs: raw.current_case_status_desc_es,
    history: raw.hist_case_status ?? [],
  };
}
