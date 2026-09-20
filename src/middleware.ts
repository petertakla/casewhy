import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getStalePolicies } from "@/lib/policy/acknowledgments";
import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_COOKIE_MAX_AGE_SECONDS,
  recordFirstTouchForUser,
  recordLanding,
  type FirstTouch,
} from "@/lib/marketing/first-touch";

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
    return applyFirstTouch(request, NextResponse.next(), session);
  }

  // Round 69 — USCIS's affidavit checklist wants "active consent" for a
  // material ToS/Privacy change, not just the existing email notice.
  // Signed-out visitors are unaffected (no session, nothing to check);
  // /policy-update itself is excluded via the matcher below so the redirect
  // can't loop.
  const { data: session } = await auth.getSession();

  // Round 124 follow-up — real bug found while building round 124: a
  // page-level `redirect()` inside an async Server Component that ALSO
  // exports metadata (static `metadata` or `generateMetadata()`) doesn't
  // actually stop the response -- Next.js 15.5.25 still resolves and ships
  // that page's own <title>/OG tags (confirmed live in production on
  // /admin and /admin/updates: a signed-out request gets a real 200 with
  // that admin page's own title, not the redirect target's). The page-
  // level and layout-level isAdminEmail checks (round 98's own "layout is
  // UX, page is the real boundary" rule) both stay in place as defense in
  // depth, but neither is actually sufficient on its own against this
  // specific framework behavior -- this middleware check is what actually
  // stops it, by redirecting before any /admin/* page or its metadata
  // resolution ever runs at all.
  if (request.nextUrl.pathname.startsWith("/admin") && !isAdminEmail(session?.user?.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session?.user) {
    const stale = await getStalePolicies(session.user.id, new Date(session.user.createdAt));
    if (stale.length > 0) {
      return NextResponse.redirect(new URL("/policy-update", request.url));
    }
  }

  return applyFirstTouch(request, NextResponse.next(), session);
}

// Round 93 Part C — first-touch UTM capture. Runs on the two "normal"
// exit paths only (the 503 holding page and the /policy-update redirect
// are edge cases; whatever they'd capture happens on the very next normal
// request instead, which is imminent either way). Two independent jobs:
// 1) if this request carries utm_* params, bump the (source, medium,
//    campaign) landing counter and, if no first-touch cookie exists yet,
//    set one (90-day window, per the task doc). 2) if a first-touch
//    cookie exists AND there's a real signed-in session, this is the
//    first authenticated request since that cookie was set — persist it
//    to firstTouchAttribution (onConflictDoNothing makes this safe to
//    attempt on every request until the cookie is cleared) and delete the
//    cookie so subsequent requests skip both DB calls entirely.
async function applyFirstTouch(
  request: NextRequest,
  response: NextResponse,
  session: { user?: { id: string } } | null | undefined
): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const source = params.get("utm_source");
  const medium = params.get("utm_medium") ?? "unknown";
  const campaign = params.get("utm_campaign") ?? "unknown";
  const existingCookie = request.cookies.get(FIRST_TOUCH_COOKIE)?.value;

  if (source) {
    await recordLanding({ source, medium, campaign });
    if (!existingCookie) {
      const touch: FirstTouch = { source, medium, campaign, at: new Date().toISOString() };
      response.cookies.set(FIRST_TOUCH_COOKIE, JSON.stringify(touch), {
        maxAge: FIRST_TOUCH_COOKIE_MAX_AGE_SECONDS,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
  } else if (existingCookie && session?.user?.id) {
    try {
      const touch = JSON.parse(existingCookie) as FirstTouch;
      await recordFirstTouchForUser(session.user.id, touch);
      response.cookies.delete(FIRST_TOUCH_COOKIE);
    } catch {
      // Malformed cookie (shouldn't happen, we're the only writer) — clear
      // it so it doesn't keep failing to parse on every future request.
      response.cookies.delete(FIRST_TOUCH_COOKIE);
    }
  }

  return response;
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
