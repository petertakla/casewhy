// TEMPORARY — one-off diagnostic. Deleted right after use.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getGmailClientForDebug } from "@/lib/email-aliases/gmail-client";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = request.nextUrl.searchParams.get("q") || "to:social@casewhy.com";
  try {
    const gmail = getGmailClientForDebug();
    const res = await gmail.users.messages.list({ userId: "me", q, maxResults: 5 });
    const messages = await Promise.all(
      (res.data.messages ?? []).map(async (m) => {
        const full = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["Subject"] });
        return { id: m.id, labelIds: full.data.labelIds, subject: full.data.payload?.headers?.[0]?.value };
      })
    );
    return NextResponse.json({ q, resultSizeEstimate: res.data.resultSizeEstimate, messages });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
