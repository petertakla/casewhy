import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

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

export async function middleware() {
  const gateEmail = process.env.ACCEPTANCE_TESTING_EMAIL;
  if (!gateEmail) return NextResponse.next();

  const { data: session } = await auth.getSession();
  if (session?.user?.email === gateEmail) {
    return NextResponse.next();
  }

  return new NextResponse(HOLDING_PAGE_HTML, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "86400" },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|apple-icon.png|auth|api/auth|api/webhooks|api/cron).*)",
  ],
};
