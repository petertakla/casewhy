import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function csvEscape(value: string | null): string {
  if (value === null) return "";
  const needsQuoting = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db.select().from(marketingQueue).orderBy(desc(marketingQueue.createdAt));

  const header = "channel,mode,destination,status,posted_at,posted_url,created_at,guardrail_notes";
  const lines = rows.map((r) =>
    [
      r.channel,
      r.mode,
      csvEscape(r.destination),
      r.status,
      r.postedAt?.toISOString() ?? "",
      csvEscape(r.postedUrl),
      r.createdAt.toISOString(),
      csvEscape(r.guardrailNotes),
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=marketing-queue-log.csv",
    },
  });
}
