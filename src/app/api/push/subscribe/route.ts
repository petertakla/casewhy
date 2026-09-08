import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { savePushSubscription, type PushSubscriptionKeys } from "@/lib/push/subscriptions";

function isValidSubscription(value: unknown): value is PushSubscriptionKeys {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.endpoint !== "string" || !v.endpoint) return false;
  if (typeof v.keys !== "object" || v.keys === null) return false;
  const keys = v.keys as Record<string, unknown>;
  return typeof keys.p256dh === "string" && typeof keys.auth === "string";
}

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

  if (!isValidSubscription(body)) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  await savePushSubscription(session.user.id, body);
  return NextResponse.json({ ok: true });
}
