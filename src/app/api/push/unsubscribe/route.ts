import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { deletePushSubscriptionByEndpoint } from "@/lib/push/subscriptions";

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { endpoint } = body as { endpoint?: unknown };
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint is required." }, { status: 400 });
  }

  // Deliberately doesn't check the endpoint belongs to this user — the
  // endpoint URL itself is an unguessable per-subscription secret, and the
  // only real action a signed-in user could take here is stopping their
  // own (or a stale) endpoint from receiving pushes, which is safe either way.
  await deletePushSubscriptionByEndpoint(endpoint);
  return NextResponse.json({ ok: true });
}
