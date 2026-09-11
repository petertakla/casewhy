import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { getStalePolicies } from "@/lib/policy/acknowledgments";

// Round 53 — gates the real production app (app.casewhy.com) to a single
// allow-listed account for the first week of live-key acceptance testing.
// The public marketing site (casewhy.com) is a separate Vercel project on
// the main branch and is untouched by this — Peter's default choice was to
// leave it public.
//
// Deliberately presence-based: ACCEPTANCE_TESTING_EMAIL unset = gate fully
// off (today's normal behavior). Set it to Peter's account email to turn
// the gate on; unset it (or clear the value) to turn it back off. No
// separate on/off boolean to keep in sync with the email itself.
//
// /auth/*, /api/auth/*, and the Stripe webhook/cron routes are excluded so
// Peter can still actually sign in during the gate, and so infrastructure
// that isn't a browser session (Stripe, Vercel Cron) keeps working.

const HOLDING_PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CaseWhy — finishing final testing</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0e17;color:#edf0f5;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px;}
  .card{max-width:420px;}
  h1{font-size:1.5rem;margin:0 0 12px;}
  p{color:#98a1b5;line-height:1.5;margin:0;}
</style>
</head>
<body>
<div class="card">
<h1>CaseWhy is finishing final testing before launch</h1>
<p>We're doing one last real-world check before opening things up. Check back soon.</p>
</div>
</body>
</html>`;

export async function middleware(request: NextRequest) {
  const gateEmail = process.env.ACCEPTANCE_TESTING_EMAIL;

  if (gateEmail) {
    const { data: session } = await auth.getSession();
    if (session?.user?.email !== gateEmail) {
      return new NextResponse(HOLDING_PAGE_HTML, {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "86400" },
      });
    }
    return NextResponse.next();
  }

  // Round 69 — USCIS's affidavit checklist wants "active consent" for a
  // material ToS/Privacy change, not just the existing email notice.
  // Signed-out visitors are unaffected (no session, nothing to check);
  // /policy-update itself is excluded via the matcher below so the redirect
  // can't loop.
  const { data: session } = await auth.getSession();
  if (session?.user) {
    const stale = await getStalePolicies(session.user.id, new Date(session.user.createdAt));
    if (stale.length > 0) {
      return NextResponse.redirect(new URL("/policy-update", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Round 69 — the policy-acknowledgment check queries Postgres directly
  // (pg's raw TCP Pool via src/lib/db/client.ts), which the default Edge
  // middleware runtime can't support (confirmed live: a real 500 on every
  // request once this landed). auth.getSession() alone never needed this,
  // since it's an HTTP fetch to Neon Auth, not a direct DB connection.
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|apple-icon.png|auth|api/auth|api/webhooks|api/cron|policy-update).*)",
  ],
};
