"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { updatesOverrides } from "@/lib/db/schema";
import { getAllUpdateSlugsFromDisk, type UpdateSource } from "@/lib/updates/updates";

// Round 107 — same requireAdmin() shape as admin/marketing/actions.ts.
async function requireAdmin(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

const MAX_BODY_BYTES = 50 * 1024;

export interface SaveOverrideInput {
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  sources: UpdateSource[];
  ogImage: string;
}

function validate(input: SaveOverrideInput): string | null {
  if (!getAllUpdateSlugsFromDisk().includes(input.slug)) {
    return "This slug no longer matches a file in the repo.";
  }
  if (!input.title.trim()) return "Title can't be empty.";
  if (!input.summary.trim()) return "Summary can't be empty.";
  if (!input.bodyMd.trim()) return "Body can't be empty.";
  if (Buffer.byteLength(input.bodyMd, "utf-8") > MAX_BODY_BYTES) return "Body is too long (50 KB max).";
  if (input.sources.length === 0) return "At least one source is required.";
  for (const source of input.sources) {
    if (!source.title.trim()) return "Every source needs a title.";
    if (!/^https:\/\//.test(source.url.trim())) return "Every source URL must start with https://.";
  }
  return null;
}

export type SaveOverrideResult = { ok: true } | { ok: false; error: string };

// Round 107, real bug caught by a live test (not in the task doc): Next.js
// redacts a Server Action's thrown Error message in production by default
// ("An error occurred in the Server Components render..." is all the
// client ever sees) -- confirmed via Vercel's function logs, which showed
// the real "Every source URL must start with https://" error landing
// server-side exactly as designed, never reaching the browser. A thrown
// Error is fine for a genuinely unexpected failure (there's nothing more
// specific to say), but the validation failures this function is
// *designed* to report readably have to come back as normal return data,
// not a throw, or "reject with a readable message" silently doesn't work
// in production at all. Save (upsert) an override -- never saves a partial row.
export async function saveOverride(input: SaveOverrideInput): Promise<SaveOverrideResult> {
  const adminEmail = await requireAdmin();
  const error = validate(input);
  if (error) return { ok: false, error };

  const db = getDb();
  await db
    .insert(updatesOverrides)
    .values({
      slug: input.slug,
      title: input.title.trim(),
      summary: input.summary.trim(),
      bodyMd: input.bodyMd,
      sourcesJson: JSON.stringify(input.sources),
      ogImage: input.ogImage.trim() || null,
      updatedAt: new Date(),
      updatedBy: adminEmail,
    })
    .onConflictDoUpdate({
      target: updatesOverrides.slug,
      set: {
        title: input.title.trim(),
        summary: input.summary.trim(),
        bodyMd: input.bodyMd,
        sourcesJson: JSON.stringify(input.sources),
        ogImage: input.ogImage.trim() || null,
        updatedAt: new Date(),
        updatedBy: adminEmail,
      },
    });

  revalidatePath(`/updates/${input.slug}`);
  revalidatePath("/updates");
  revalidatePath("/admin/updates");
  revalidatePath(`/admin/updates/${input.slug}/edit`);
  revalidatePath("/admin/marketing");
  return { ok: true };
}

/** Deletes the override row -- the post reverts to exactly the repo file. */
export async function revertOverride(slug: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  await db.delete(updatesOverrides).where(eq(updatesOverrides.slug, slug));

  revalidatePath(`/updates/${slug}`);
  revalidatePath("/updates");
  revalidatePath("/admin/updates");
  revalidatePath(`/admin/updates/${slug}/edit`);
  revalidatePath("/admin/marketing");
}
