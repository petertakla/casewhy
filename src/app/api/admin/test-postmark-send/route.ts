// Cloud session update, Sep 14 (2) — "test each for real," not just check
// a dashboard status. Sends one real Postmark email to a caller-supplied
// address and reports the exact outcome (success, or the real HTTP status
// + body Postmark returns) -- this is the actual test that answers "is
// the account approved yet," since a prior session already found the
// concrete symptom of the pending-approval state: Postmark hard-rejects
// (SMTP 412) any recipient not on the casewhy.com domain. A 200 here to a
// real non-casewhy.com address means approval has landed; a 412-shaped
// error means it hasn't, regardless of what the dashboard UI might show.
//
// Bearer-secured with CRON_SECRET, same pattern as every other one-off
// admin/diagnostic route this session -- pass ?to=<address> to choose the
// test recipient.

const FROM_ADDRESS = "info@casewhy.com";

export async function POST(request: Request) {
  // ADMIN_DIAG_SECRET, not CRON_SECRET -- see setup-community-labels's
  // own comment on why this session's diagnostic routes use a secret it
  // generated itself rather than the shared, unreadable CRON_SECRET.
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    return Response.json({ error: "POSTMARK_API_TOKEN not configured." }, { status: 503 });
  }

  const to = new URL(request.url).searchParams.get("to");
  if (!to) {
    return Response.json({ error: "Pass ?to=<recipient address> to choose the test recipient." }, { status: 400 });
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
      Subject: "CaseWhy Postmark approval test",
      TextBody: "This is a real test send to check whether Postmark's account-approval restriction has lifted for non-casewhy.com recipients. No action needed.",
      MessageStream: "outbound",
    }),
  });

  const body = await res.text();
  return Response.json({
    httpStatus: res.status,
    postmarkResponse: body,
    conclusion: res.ok
      ? "Sent successfully -- Postmark approval appears to have landed for this recipient domain."
      : "Send failed -- read postmarkResponse for the real reason (a 412-shaped error means still pending approval).",
  });
}
