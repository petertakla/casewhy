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

/** Save (upsert) an override. Throws with a readable message on validation failure -- never saves a partial row. */
export async function saveOverride(input: SaveOverrideInput): Promise<void> {
  const adminEmail = await requireAdmin();
  const error = validate(input);
  if (error) throw new Error(error);

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
