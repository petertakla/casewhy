// Round 70 — real Gmail API access to info@casewhy.com, via a Google
// Workspace service account with domain-wide delegation (not this
// session's own Gmail tool access, which is tied to ptakla@gmail.com and
// has no programmatic API — see CLOUD_CLAUDE.md items 89/92 for why that
// distinction matters here).
//
// Requires two env vars neither this session nor the cloud session can
// set: GMAIL_SERVICE_ACCOUNT_KEY (the service account's JSON key, as a
// single-line string) and GMAIL_IMPERSONATE_EMAIL (defaults to
// info@casewhy.com). The service account also needs domain-wide
// delegation granted in the Workspace admin console (Security > API
// controls > Domain-wide Delegation) for the gmail.readonly,
// gmail.send, and gmail.labels scopes — a real setup step for Peter,
// not something either Claude session has admin access to do itself.
// Every exported function throws a clear, specific error (not a silent
// no-op) if the key is missing, so a misconfigured deploy fails loudly
// at the poller/send call site rather than pretending to succeed.

import { google } from "googleapis";

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.modify",
];

function getAuthClient() {
  const key = process.env.GMAIL_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      "GMAIL_SERVICE_ACCOUNT_KEY is not configured — see round70-domain-response-aliases-task.md for the required Workspace setup (service account + domain-wide delegation)."
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
    scopes: REQUIRED_SCOPES,
    subject: impersonate,
  });
}

function getGmailClient() {
  return google.gmail({ version: "v1", auth: getAuthClient() });
}

export interface GmailAliasMessage {
  id: string;
  from: string;
  subject: string;
  receivedAt: Date;
  bodyText: string;
}

// Matches Gmail's own base64url message-part encoding.
function extractPlainText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { mimeType?: string; body?: { data?: string }; parts?: unknown[] };
  if (p.mimeType === "text/plain" && p.body?.data) {
    return Buffer.from(p.body.data, "base64url").toString("utf-8");
  }
  for (const part of p.parts ?? []) {
    const text = extractPlainText(part);
    if (text) return text;
  }
  return null;
}

/** Lists unread messages under a given Gmail label, newest first. Returns [] if the label doesn't exist (not an error — a filter just hasn't created it yet). */
export async function listUnreadMessagesByLabel(labelName: string): Promise<GmailAliasMessage[]> {
  const gmail = getGmailClient();
  const labelsRes = await gmail.users.labels.list({ userId: "me" });
  const label = labelsRes.data.labels?.find((l) => l.name === labelName);
  if (!label?.id) return [];

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: [label.id],
    q: "is:unread",
    maxResults: 25,
  });
  const messageRefs = listRes.data.messages ?? [];

  const results: GmailAliasMessage[] = [];
  for (const ref of messageRefs) {
    if (!ref.id) continue;
    const full = await gmail.users.messages.get({ userId: "me", id: ref.id, format: "full" });
    const headers = full.data.payload?.headers ?? [];
    const from = headers.find((h) => h.name === "From")?.value ?? "unknown";
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
    const dateHeader = headers.find((h) => h.name === "Date")?.value;
    const bodyText = extractPlainText(full.data.payload) ?? full.data.snippet ?? "";
    results.push({
      id: ref.id,
      from,
      subject,
      receivedAt: dateHeader ? new Date(dateHeader) : new Date(),
      bodyText,
    });
  }
  return results;
}

/** Removes UNREAD so the next poll doesn't re-fetch the same message — the pendingAliasActions.gmailMessageId unique constraint would also catch a duplicate, but this keeps the inbox itself accurate too. */
export async function markMessageProcessed(messageId: string): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

function buildRawMessage(params: { fromAddress: string; to: string; subject: string; body: string }): string {
  const message = [
    `From: ${params.fromAddress}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    params.body,
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

/** Sends a real email from a specific casewhy.com alias — must already be a configured Workspace alias on the impersonated account, or Gmail rejects the send. */
export async function sendAsAlias(params: {
  fromAlias: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const gmail = getGmailClient();
  const fromAddress = `${params.fromAlias}@casewhy.com`;
  const raw = buildRawMessage({ ...params, fromAddress });
  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}

/** True only if the required env vars are present — lets callers skip cleanly with a clear status instead of throwing mid-poll. */
export function isGmailApiConfigured(): boolean {
  return Boolean(process.env.GMAIL_SERVICE_ACCOUNT_KEY);
}
