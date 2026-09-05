import { NextRequest, NextResponse } from "next/server";
import { subscribeEmail } from "@/lib/marketing/subscribe";

// Public, cross-origin endpoint the separate static casewhy.com site
// (main branch, its own Vercel project — no Next.js backend of its own)
// calls to submit its "Notify me" forms. Those forms had no backend at
// all before this — a real bug a user hit directly, not a hypothetical.
const ALLOWED_ORIGINS = new Set(["https://casewhy.com", "https://www.casewhy.com"]);

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400, headers });
  }

  const { email, sourcePage, website } = body as {
    email?: unknown;
    sourcePage?: unknown;
    website?: unknown;
  };
  if (typeof email !== "string" || typeof sourcePage !== "string") {
    return NextResponse.json(
      { ok: false, error: "email and sourcePage are required." },
      { status: 400, headers }
    );
  }

  const result = await subscribeEmail({
    email,
    sourcePage,
    website: typeof website === "string" ? website : undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
}
