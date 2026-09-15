import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUpdateBySlugFromDisk, getOverrideForSlug, getPublishedUpdateBySlug } from "@/lib/updates/updates";
import { EditorForm } from "./EditorForm";

// Round 107 — the Markdown editor. getUpdateBySlugFromDisk already
// returns the merged (override-applied, if one exists) post, so this
// page's initial form values are exactly what the preview and the public
// page (once published) would show -- the same single merge point every
// other reader goes through.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit: ${slug} | Admin | CaseWhy` };
}

export default async function EditUpdatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const { slug } = await params;
  const [post, override, published] = await Promise.all([
    getUpdateBySlugFromDisk(slug),
    getOverrideForSlug(slug),
    getPublishedUpdateBySlug(slug),
  ]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Edit: {post.title}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">
        Editing the live override for <code className="font-mono">content/updates/{slug}.md</code> — saving here never
        touches the repo file.
      </p>

      <EditorForm
        slug={slug}
        initialTitle={post.title}
        initialSummary={post.summary}
        initialBodyMd={post.content}
        initialSources={post.sources}
        initialOgImage={post.ogImage}
        hasOverride={override !== null}
        isPublished={published !== null}
      />
    </div>
  );
}
