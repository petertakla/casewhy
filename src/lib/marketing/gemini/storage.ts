// Round 91 — storage for generated marketing assets. The task doc
// guessed "Supabase/S3 -- whatever the document vault uses"; checked
// directly (src/app/api/documents/route.ts) and the real document vault
// uses @vercel/blob's put(), already a dependency -- no Supabase or S3
// client exists anywhere in this codebase. Reused the real mechanism
// instead of adding a new one.

import { put } from "@vercel/blob";

// The document vault's existing store (BLOB_READ_WRITE_TOKEN) is
// configured private -- appropriate for user documents, confirmed by a
// real failed put() call ("Cannot use public access on a private
// store") before working around it. Marketing assets need to be
// publicly fetchable (Pinterest/YouTube's own APIs fetch by URL, and the
// admin queue renders them inline), so this round provisioned a second,
// public-access Blob store (casewhy-marketing) connected under its own
// prefix -- MARKETING_BLOB_READ_WRITE_TOKEN -- rather than changing the
// existing store's access level or reusing its token.
export async function uploadMarketingAsset(params: {
  pillar: string;
  briefId: string;
  fileName: string;
  contentType: string;
  data: Buffer;
}): Promise<string> {
  const token = process.env.MARKETING_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("MARKETING_BLOB_READ_WRITE_TOKEN is not set -- the casewhy-marketing Blob store isn't connected.");
  }
  const date = new Date().toISOString().slice(0, 10);
  const path = `marketing/${params.pillar}/${date}/${params.briefId}-${params.fileName}`;
  const blob = await put(path, params.data, {
    access: "public",
    contentType: params.contentType,
    addRandomSuffix: false,
    // A brief's path is (pillar, date, briefId, filename) -- stable and
    // meant to be one URL per brief. Real case caught during testing: a
    // re-render (e.g. after a first attempt failed partway, or an admin
    // regenerates a low-quality asset) hits the same path and Vercel
    // Blob rejects a same-path write by default. Overwrite is the
    // correct behavior here, not a random suffix -- the old asset was
    // never meant to be a separate, permanent artifact.
    allowOverwrite: true,
    token,
  });
  return blob.url;
}
