import { NextRequest, NextResponse } from "next/server";
import { submitEmployerLead } from "@/lib/marketing/employer-leads";

// Round 94 — public, cross-origin endpoint casewhyhub.com/employers
// calls to submit its lead form. Same CORS pattern as /api/subscribe
// (round 7), scoped to the new casewhyhub.com domain specifically, not
// added to that route's own ALLOWED_ORIGINS -- a different form, a
// different table, kept as its own endpoint rather than overloading an
// existing one with a second shape of request body.
const ALLOWED_ORIGINS = new Set(["https://casewhyhub.com", "https://www.casewhyhub.com"]);

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

  const { company, teamSize, contactName, email, needs, utmSource, utmMedium, utmCampaign, website } = body as Record<string, unknown>;

  if (
    typeof company !== "string" ||
    typeof teamSize !== "string" ||
    typeof contactName !== "string" ||
    typeof email !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "company, teamSize, contactName, and email are required." },
      { status: 400, headers }
    );
  }

  const result = await submitEmployerLead({
    company,
    teamSize,
    contactName,
    email,
    needs: typeof needs === "string" ? needs : undefined,
    utmSource: typeof utmSource === "string" ? utmSource : undefined,
    utmMedium: typeof utmMedium === "string" ? utmMedium : undefined,
    utmCampaign: typeof utmCampaign === "string" ? utmCampaign : undefined,
    website: typeof website === "string" ? website : undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
}
