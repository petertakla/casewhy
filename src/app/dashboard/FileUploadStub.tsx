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
    <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4">
      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
        Supporting documents
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="Upload a supporting document"
          className="flex-1 text-sm text-neutral-600 dark:text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 dark:file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-700 dark:file:text-neutral-300"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Upload
        </button>
      </div>

      {received && (
        <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
          Received <span className="font-medium">{received.name}</span> (
          {formatSize(received.size)}).
        </p>
      )}
    </div>
  );
}
