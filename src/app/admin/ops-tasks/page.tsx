import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { opsTasks } from "@/lib/db/schema";
import { OpsTaskCard } from "./OpsTaskCard";

export const dynamic = "force-dynamic";

// Round 112 Part B — recurring tasks that need a real human step and
// can't be fully automated (see src/lib/ops/ops-tasks.ts and the monthly
// /api/cron/generate-ops-tasks route that populates this queue).
export default async function OpsTasksAdminPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(opsTasks)
    .where(eq(opsTasks.status, "pending"))
    .orderBy(desc(opsTasks.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Ops tasks</h1>
      <p className="mb-8 mt-2 text-muted">
        Recurring tasks a cron job noticed were due but can&apos;t fully automate itself — usually because the
        real source blocks automated fetches and needs a real browser. Mark done once handled, or dismiss if it
        doesn&apos;t apply this cycle.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          Nothing pending right now.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <OpsTaskCard
              key={row.id}
              id={row.id}
              title={row.title}
              description={row.description}
              createdAt={row.createdAt.toISOString().slice(0, 10)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
