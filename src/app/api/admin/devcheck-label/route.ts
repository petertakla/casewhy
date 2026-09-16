// TEMPORARY — one-off diagnostic to check real Gmail label/message state
// directly, bypassing the per-alias poll-interval gate. Deleted right
// after use, same pattern as this project's other devpreview routes.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { listUnreadMessagesByLabel, getLabelId } from "@/lib/email-aliases/gmail-client";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const label = request.nextUrl.searchParams.get("label") || "Alias/Press";
  try {
    const labelId = await getLabelId(label);
    const messages = await listUnreadMessagesByLabel(label);
    return NextResponse.json({
      label,
      labelId,
      unreadCount: messages.length,
      messages: messages.map((m) => ({ id: m.id, from: m.from, subject: m.subject, receivedAt: m.receivedAt })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
