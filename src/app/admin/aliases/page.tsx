import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { emailAliasConfigs } from "@/lib/db/schema";
import { AliasConfigRow } from "./AliasConfigRow";

export const dynamic = "force-dynamic";

export default async function AdminAliasesPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const configs = await db.select().from(emailAliasConfigs).orderBy(asc(emailAliasConfigs.alias));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Alias monitoring config</h1>
      <p className="mb-8 mt-2 text-muted">
        Per-alias poll interval and action level — edits apply on the next poll, no code change needed.
      </p>

      <div className="space-y-3">
        {configs.map((config) => (
          <AliasConfigRow key={config.id} {...config} />
        ))}
      </div>
    </main>
  );
}
