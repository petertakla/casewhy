import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { caseDocuments, trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

async function assertOwnsTrackedCase(userId: string, trackedCaseId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: trackedCases.id })
    .from(trackedCases)
    .where(and(eq(trackedCases.id, trackedCaseId), eq(trackedCases.userId, userId)));
  return !!row;
}

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const trackedCaseId = request.nextUrl.searchParams.get("trackedCaseId");
  if (!trackedCaseId) {
    return NextResponse.json({ error: "trackedCaseId is required." }, { status: 400 });
  }
  if (!(await assertOwnsTrackedCase(session.user.id, trackedCaseId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: caseDocuments.id,
      fileName: caseDocuments.fileName,
      contentType: caseDocuments.contentType,
      sizeBytes: caseDocuments.sizeBytes,
      createdAt: caseDocuments.createdAt,
    })
    .from(caseDocuments)
    .where(eq(caseDocuments.trackedCaseId, trackedCaseId))
    .orderBy(asc(caseDocuments.createdAt));

  const documents = rows.flatMap((row) => {
    try {
      return [{ ...row, fileName: decryptField(row.fileName) }];
    } catch {
      return []; // malformed/undecryptable row — skip rather than 500 the whole list
    }
  });

  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const trackedCaseId = form.get("trackedCaseId");
  const file = form.get("file");
  if (typeof trackedCaseId !== "string" || !trackedCaseId) {
    return NextResponse.json({ error: "trackedCaseId is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  if (!(await assertOwnsTrackedCase(session.user.id, trackedCaseId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large (10 MB max)." }, { status: 413 });
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, JPEG, and PNG files are accepted." },
      { status: 415 }
    );
  }

  const blob = await put(`documents/${trackedCaseId}/${file.name}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  });

  const db = getDb();
  const [row] = await db
    .insert(caseDocuments)
    .values({
      trackedCaseId,
      userId: session.user.id,
      fileName: encryptField(file.name),
      contentType: file.type,
      sizeBytes: file.size,
      blobPathname: blob.pathname,
    })
    .returning({ id: caseDocuments.id, createdAt: caseDocuments.createdAt });

  return NextResponse.json({
    id: row.id,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    createdAt: row.createdAt,
  });
}
