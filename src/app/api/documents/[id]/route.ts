import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { del, get } from "@vercel/blob";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { caseDocuments } from "@/lib/db/schema";
import { decryptField } from "@/lib/db/crypto";

async function getOwnedDocument(userId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(caseDocuments)
    .where(and(eq(caseDocuments.id, id), eq(caseDocuments.userId, userId)));
  return row;
}

// Streams the file back through our own server rather than exposing the
// blob URL directly — the store is private, so a bare .private.blob.
// vercel-storage.com URL isn't fetchable without the read-write token
// anyway, and proxying here also lets us re-check ownership per request.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const row = await getOwnedDocument(session.user.id, id);
  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const blob = await get(row.blobPathname, { access: "private" });
  if (!blob) {
    return NextResponse.json({ error: "File is missing from storage." }, { status: 404 });
  }

  let fileName = row.fileName;
  try {
    fileName = decryptField(row.fileName);
  } catch {
    // fall back to the encrypted value rather than fail the download
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": row.contentType,
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Content-Length": String(row.sizeBytes),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const row = await getOwnedDocument(session.user.id, id);
  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await del(row.blobPathname);

  const db = getDb();
  await db.delete(caseDocuments).where(eq(caseDocuments.id, id));

  return NextResponse.json({ ok: true });
}
