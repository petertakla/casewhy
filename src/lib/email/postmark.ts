// Thin wrapper around Postmark's HTTP API — no SDK, just fetch. No-ops with
// a warning if POSTMARK_API_TOKEN isn't configured yet, so the status-change
// polling/diff logic can be built and tested before the Postmark account
// exists.

const FROM_ADDRESS = "info@casewhy.com";

export async function sendStatusChangeEmail({
  to,
  receiptNumber,
  statusText,
  statusDescription,
}: {
  to: string;
  receiptNumber: string;
  statusText: string;
  statusDescription: string;
}): Promise<void> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.warn(
      `[postmark] POSTMARK_API_TOKEN not set — skipping status-change email for ${receiptNumber}`
    );
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: FROM_ADDRESS,
      To: to,
      Subject: `Your case ${receiptNumber} has a new status`,
      TextBody: [
        `Your case ${receiptNumber} now shows:`,
        "",
        statusText,
        "",
        statusDescription,
        "",
        "Sign in to CaseWhy to see the full details.",
      ].join("\n"),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  }
}
