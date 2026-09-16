// Round 113 — admin-gated wrapper around ensureAlias() (Directory API).
// The underlying function needs GMAIL_SERVICE_ACCOUNT_KEY, which (like
// every other Secret-type env var in this project) is only set in
// Vercel's Production environment and can't be pulled locally — this
// route is the real, permanent way "one script call" (the task doc's own
// phrase) actually happens going forward: hit this route from an
// authenticated admin session (the standing bot-checkpoint workaround
// for this project — an already-signed-in browser tab, or curl with a
// real admin session cookie) rather than needing the secret on a local
// machine at all.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { ensureAlias } from "@/lib/email-aliases/directory-client";

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { localPart } = body as Record<string, unknown>;
  if (typeof localPart !== "string" || !/^[a-z0-9.-]+$/i.test(localPart)) {
    return NextResponse.json({ error: "localPart must be a plain alphanumeric string." }, { status: 400 });
  }

  try {
    const result = await ensureAlias(localPart);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
