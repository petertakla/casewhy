// USCIS FOIA Request and Status API client.
//
// Confirmed against developer.uscis.gov/api/foia-request-and-status docs
// (v1.2.0, Sep 2026):
//   - Sandbox server: https://api-int.uscis.gov/first-case-sbox
//   - Same OAuth 2.0 client_credentials flow as the Case Status API
//     (shared uscisRequest() helper — same token URL, same client_id/secret).
//   - Case Create:  POST /case          -> { data: { requestNumber } }
//   - Case Status:  GET  /case-status   -> FoiaCaseStatus (not data-wrapped;
//     `error` is inline and null on success). Query by caseControlNumber
//     and/or requestNumber.
//
// Uses its own credential pair (USCIS_FOIA_CLIENT_ID/SECRET), not the Case
// Status one — USCIS confirmed Sep 5, 2026 that the credential previously
// assumed to be an inert duplicate is the real, active FOIA credential; the
// original 401s were from using the Case Status pair against this API,
// which was never going to work regardless of the product-enablement
// setting. See getUscisFoiaConfig() in src/lib/config.ts.
//
// Compliance note: USCIS requires specific disclosure text to be shown in
// the UI near the request form, the email field, the document upload
// section, and the status/action display (see "Requirements for FOIA/PA
// Request API" #1-#4 on the docs page). Not reproduced here — pull the
// current text from the docs page directly before shipping any UI for this.

import { uscisRequest } from "@/lib/uscis/client";
import { getUscisFoiaConfig } from "@/lib/config";

const FOIA_BASE_PATH = "/first-case-sbox";
const FOIA_CASE_CREATE_PATH = `${FOIA_BASE_PATH}/case`;
const FOIA_CASE_STATUS_PATH = `${FOIA_BASE_PATH}/case-status`;

/**
 * `mailingCountry` (here and on InternationalAddress below) must be an ISO
 * 3166-1 alpha-2 code (e.g. "US", not "USA") or "UNK"/"UNS" — confirmed via
 * a real sandbox test, Sep 5, 2026: "USA" produced a cascade of confusing
 * validation errors on unrelated fields, because the API silently treated
 * the unrecognized value as "not US" rather than rejecting it directly.
 */
interface DomesticAddress {
  mailingCountry: string;
  mailingState: string;
  mailingAddress1: string;
  mailingAddress2?: string;
  mailingCity: string;
  mailingZipCode: string;
}

interface InternationalAddress {
  mailingCountry: string;
  mailingAddress1: string;
  mailingAddress2?: string;
  mailingCity: string;
  mailingProvince: string;
  mailingPostalCode?: string;
}

interface PersonName {
  firstName: string;
  lastName: string;
  middleName?: string;
  entryFirstName?: string;
  entryLastName?: string;
  entryMiddleName?: string;
}

export type FoiaSubject =
  | (PersonName &
      DomesticAddress & {
        dateOfBirth: string; // YYYY-MM-DD
        birthCountry: string;
        emailAddress?: string;
        daytimePhone?: string;
        mobilePhone?: string;
      })
  | (PersonName &
      InternationalAddress & {
        dateOfBirth: string;
        birthCountry: string;
        emailAddress?: string;
        daytimePhone?: string;
        mobilePhone?: string;
      });

export type FoiaRequester =
  | (Omit<PersonName, "entryFirstName" | "entryLastName" | "entryMiddleName"> &
      DomesticAddress & {
        emailAddress: string;
        organization?: string;
        daytimePhone?: string;
        mobilePhone?: string;
      })
  | (Omit<PersonName, "entryFirstName" | "entryLastName" | "entryMiddleName"> &
      InternationalAddress & {
        emailAddress: string;
        organization?: string;
        daytimePhone?: string;
        mobilePhone?: string;
      });

/**
 * One entry in `family`. The API's formal schema only defines Father/Mother
 * shapes (relation "F"/"M"), both required in every request — the docs say
 * a father and mother entry must always be present, with "Unknown" for
 * name fields if the real names aren't known. Other relations (child,
 * spouse, sibling, other) are accepted but not schema-validated.
 */
export interface FamilyMember {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  relation: "F" | "M" | "CHI" | "SPO" | "SIB" | "OTH";
}

/** Known requestedDocumentType codes for a plain RecordRequest (no date, no free-text needed). */
export type RecordDocumentType =
  | "BIRC" // Birth Certificate
  | "PASS" // Passport
  | "I129" // I-129: Petition for a Nonimmigrant Worker
  | "I90" // I-90: Application to Replace Permanent Resident Card
  | "I130" // I-130: Petition for Alien Relative
  | "I140" // I-140: Immigrant Petition for Alien Workers
  | "I485" // I-485: Application to Register Permanent Residence or Adjust Status
  | "I751" // I-751: Petition to Remove Conditions on Residence
  | "N400" // N-400: Application for Naturalization
  | "LABC" // Labor certification issued by the U.S. Department of Labor
  | "NATC" // Naturalization Certificate
  | "LPR"; // Proof of Lawful Permanent Resident status

export type RecordRequestItem =
  | { requestedDocumentType: RecordDocumentType }
  | { requestedDocumentType: "APPR" | "I94" | "OAD" | "RRUS"; requestedDocumentDate?: string }
  | { requestedDocumentType: "OTH"; otherDescription: string };

export interface RepresentiveRole {
  /** Defaults to "ATTORNEY" server-side if omitted. */
  role?: "ATTORNEY" | "OTHERFAMILY";
  otherExplain?: string;
}

export interface ExpeditedReason {
  physicalThreat?: boolean;
  informPublic?: boolean;
  dueProcess?: boolean;
  mediaInterest?: boolean;
}

export interface FoiaDocument {
  /** Base64-encoded file content. */
  content: string;
  fileName: string;
}

export interface CaseCreateRequest {
  alienNumber?: string;
  alienNumbers?: number[];
  subject: FoiaSubject;
  /** Must include one "F" (father) and one "M" (mother) entry; minItems 2. */
  family: FamilyMember[];
  aliases?: PersonName[];
  /**
   * Typed optional per the docs schema, but a real sandbox test (Sep 5,
   * 2026, once the FOIA credential fix landed) 500'd with a null-pointer
   * when this was omitted — the live API needs it even though the schema
   * doesn't say so. Always send one.
   */
  requester?: FoiaRequester;
  /** Receipt number(s) this request relates to, e.g. "IOE1234567890". */
  receiptNumber?: string[];
  receiptNumbers?: string[];
  representiveRoleToSubjectOfRecord?: RepresentiveRole;
  /**
   * Typed optional per the docs schema, but the live API 400s without a
   * value it recognizes as "a valid MyAccount email" (sandbox test, Sep 5,
   * 2026) — sign up for a USCIS MyAccount at myaccount.uscis.gov to get one
   * to test with; not yet done as of this writing.
   */
  digitalDelivery?: string;
  preferredConsentMethod?: string;
  courtProceedings?: boolean;
  recordsRequested: RecordRequestItem[];
  qualificationsForExpeditedProcessing?: ExpeditedReason;
  documents?: FoiaDocument[];
}

/**
 * Create a FOIA/PA request. Returns the request number (e.g. "NRC123456789REQ")
 * — evidence of submission, not yet a trackable case. USCIS later issues a
 * separate control number once the case is created; poll getFoiaCaseStatus
 * with that control number (or this request number) to see it appear.
 */
export async function createFoiaCase(payload: CaseCreateRequest): Promise<string> {
  const { data } = await uscisRequest<{ data: { requestNumber: string } }>(
    FOIA_CASE_CREATE_PATH,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    getUscisFoiaConfig()
  );
  return data.requestNumber;
}

export type FoiaStatusCode =
  | "CONSENT_REQUIRED"
  | "REQUEST_CANCELED_SUBJECT_DENIED"
  | "REQUEST_CANCELED_SUBJECT_SUGGESTED_CHANGES"
  | "REQUEST_CANCELED_EXPIRED"
  | "SUBMITTED"
  | "USCIS_REVIEWING"
  | "RESPONSE_ISSUED";

export interface FoiaCaseStatus {
  caseControlNumber: string;
  requestNumber: string;
  queueLength: number;
  placeInQueue: number;
  requestReceivedTimestamp: string; // ISO 8601
  trackId: number;
  requestDescription: string;
  estCompletionDate: string; // ISO 8601
  topic: string;
  publicStatusCode: { display: string };
  status: {
    code: FoiaStatusCode;
    display: string;
    description: string;
  };
  error: null;
}

/** Look up a FOIA case by control number and/or request number (at least one is required). */
export async function getFoiaCaseStatus(params: {
  caseControlNumber?: string;
  requestNumber?: string;
}): Promise<FoiaCaseStatus> {
  if (!params.caseControlNumber && !params.requestNumber) {
    throw new Error("getFoiaCaseStatus requires caseControlNumber and/or requestNumber");
  }
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
  return uscisRequest<FoiaCaseStatus>(`${FOIA_CASE_STATUS_PATH}?${query}`, {}, getUscisFoiaConfig());
}
