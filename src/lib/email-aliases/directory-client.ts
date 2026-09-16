// Round 113 — Google Admin SDK Directory API access to info@casewhy.com's
// Workspace user record, via the same service account + domain-wide
// delegation round 70 already set up for Gmail API access. Peter's own
// one-time step (round 113 Part A, confirmed done Sep 16): extended that
// service account's domain-wide-delegation scopes in admin.google.com to
// add https://www.googleapis.com/auth/admin.directory.user.alias,
// alongside the existing gmail.* scopes. That's what makes this file
// possible at all -- before this, Code could create Gmail labels/filters
// on info@ (round 70/87) but never the Workspace alias itself, which is
// why press@ (round 111) sat on Peter's checklist. This should be the
// last alias that ever needs a Peter step.
//
// Same required env vars as gmail-client.ts: GMAIL_SERVICE_ACCOUNT_KEY,
// GMAIL_IMPERSONATE_EMAIL (defaults to info@casewhy.com).

import { google } from "googleapis";

const DIRECTORY_SCOPES = ["https://www.googleapis.com/auth/admin.directory.user.alias"];

function getAuthClient() {
  const key = process.env.GMAIL_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      "GMAIL_SERVICE_ACCOUNT_KEY is not configured -- see round113-social-alias-and-code-managed-aliases-task.md."
    );
  }
  const impersonate = process.env.GMAIL_IMPERSONATE_EMAIL || "info@casewhy.com";

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(key);
  } catch {
    throw new Error("GMAIL_SERVICE_ACCOUNT_KEY is not valid JSON.");
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: DIRECTORY_SCOPES,
    subject: impersonate,
  });
}

function getDirectoryClient() {
  return google.admin({ version: "directory_v1", auth: getAuthClient() });
}

const DOMAIN = "casewhy.com";

/** The real Workspace user info@ is impersonating as, e.g. "info@casewhy.com". */
function primaryUser(): string {
  return process.env.GMAIL_IMPERSONATE_EMAIL || "info@casewhy.com";
}

export async function listAliases(): Promise<string[]> {
  const admin = getDirectoryClient();
  const res = await admin.users.aliases.list({ userKey: primaryUser() });
  return (res.data.aliases ?? []).map((a) => (a as { alias?: string }).alias).filter((a): a is string => !!a);
}

export interface EnsureAliasResult {
  alias: string;
  created: boolean; // false if it already existed (idempotent no-op)
}

/** Idempotent: creates <localPart>@casewhy.com as a Workspace alias on info@casewhy.com if it doesn't already exist. */
export async function ensureAlias(localPart: string): Promise<EnsureAliasResult> {
  const alias = `${localPart}@${DOMAIN}`;
  const existing = await listAliases();
  if (existing.includes(alias)) {
    return { alias, created: false };
  }
  const admin = getDirectoryClient();
  await admin.users.aliases.insert({
    userKey: primaryUser(),
    requestBody: { alias },
  });
  return { alias, created: true };
}
