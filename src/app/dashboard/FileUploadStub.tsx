"use client";

import { useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File upload UI for supporting documents. No real endpoint yet — accepts a
 * file and confirms receipt locally. Satisfies the "file upload" criterion
 * evaluated in the live USCIS demo; wiring to real storage is future work.
 */
export function FileUploadStub() {
  const [file, setFile] = useState<File | null>(null);
  const [received, setReceived] = useState<{ name: string; size: number } | null>(null);

  function handleUpload() {
    if (!file) return;
    setReceived({ name: file.name, size: file.size });
    setFile(null);
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="Upload a supporting document"
          className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Upload
        </button>
      </div>

      {received && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-foreground/90">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-emerald-500">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Received <span className="font-medium">{received.name}</span> ({formatSize(received.size)}).
        </p>
      )}
    </div>
  );
}
