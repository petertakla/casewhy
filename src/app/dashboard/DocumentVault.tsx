"use client";

import { useCallback, useEffect, useState } from "react";

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
 */
export function DocumentVault({ trackedCaseId }: { trackedCaseId?: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trackedCaseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?trackedCaseId=${encodeURIComponent(trackedCaseId)}`);
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
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      await load();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await load();
  }

  if (!trackedCaseId) {
    return (
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
          Supporting documents
        </p>
        <p className="text-sm text-muted">Track this case to store supporting documents for it.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        Supporting documents
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
          aria-label="Upload a supporting document"
          className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground disabled:opacity-50"
        />
        {uploading && <span className="text-xs text-muted">Uploading…</span>}
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
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && documents.length === 0 && (
        <p className="mt-3 text-xs text-muted">No documents uploaded yet.</p>
      )}
    </div>
  );
}
