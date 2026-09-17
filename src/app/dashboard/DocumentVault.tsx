"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusBadge } from "@/components/PlusBadge";
import { PendingButton } from "@/components/PendingButton";
import { apiRequest } from "@/lib/http/apiRequest";

interface DocumentItem {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * CW-38 document vault: real upload/list/download/delete against
 * /api/documents, backed by a private Vercel Blob store. Documents are tied
 * to one tracked case (trackedCaseId), not just the account — CW-36 made
 * tracking multi-case, so a document has to say which case it belongs to.
 * Round 12 — gated to CaseWhy Plus (the API enforces this too; this client
 * gate just avoids showing an upload UI that would 402 on every attempt).
 */
export function DocumentVault({
  trackedCaseId,
  canUseVault,
  es,
}: {
  trackedCaseId?: string;
  canUseVault: boolean;
  es: boolean;
}) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trackedCaseId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/documents?trackedCaseId=${encodeURIComponent(trackedCaseId)}`);
      const data = await res.json();
      if (res.ok) setDocuments(data.documents);
    } finally {
      setLoading(false);
    }
  }, [trackedCaseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File | undefined) {
    if (!file || !trackedCaseId) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("trackedCaseId", trackedCaseId);
      form.set("file", file);
      // 60s, not the default 15s — this is a real file upload, not a JSON call.
      const res = await apiRequest("/api/documents", { method: "POST", body: form, timeoutMs: 60000 });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (es ? "La subida falló." : "Upload failed."));
        return;
      }
      await load();
    } catch {
      setError(es ? "La subida falló. Por favor intenta de nuevo." : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiRequest(`/api/documents/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  if (!trackedCaseId) {
    return (
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "Documentos de apoyo" : "Supporting documents"}
        </p>
        <p className="text-sm text-muted">
          {es ? "Rastrea este caso para almacenar documentos de apoyo para él." : "Track this case to store supporting documents for it."}
        </p>
      </div>
    );
  }

  if (!canUseVault) {
    return (
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "Documentos de apoyo" : "Supporting documents"}
        </p>
        <p className="text-sm text-muted">
          <Link href="/plus" className="text-brand-600 hover:underline dark:text-brand-400">
            {es ? (
              <>
                Actualiza a CaseWhy <PlusBadge size="sm" />
              </>
            ) : (
              <>
                Upgrade to CaseWhy <PlusBadge size="sm" />
              </>
            )}
          </Link>{" "}
          {es ? "para una bóveda segura de documentos." : "for a secure document vault."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {es ? "Documentos de apoyo" : "Supporting documents"}
      </p>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong bg-background/40 p-4 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            handleUpload(file);
          }}
          disabled={uploading}
          aria-label={es ? "Subir un documento de apoyo" : "Upload a supporting document"}
          className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground disabled:opacity-50"
        />
        {uploading && <span className="text-xs text-muted">{es ? "Subiendo…" : "Uploading…"}</span>}
      </div>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {documents.length > 0 && (
        <ul className="mt-3 space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <a
                href={`/api/documents/${doc.id}`}
                className="min-w-0 truncate text-brand-600 hover:underline dark:text-brand-400"
              >
                {doc.fileName}
              </a>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span>{formatSize(doc.sizeBytes)}</span>
                <PendingButton
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  pending={deletingId === doc.id}
                  pendingLabel={es ? "Eliminando…" : "Removing…"}
                  className="inline-flex items-center gap-1 text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
                  spinnerClassName="h-3 w-3"
                >
                  {es ? "Eliminar" : "Remove"}
                </PendingButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && documents.length === 0 && (
        <p className="mt-3 text-xs text-muted">{es ? "Ningún documento subido aún." : "No documents uploaded yet."}</p>
      )}
    </div>
  );
}
