"use client";

import { useState, useTransition } from "react";
import { submitDsoApplication } from "./actions";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500";

export function ApplicationForm() {
  const [schoolName, setSchoolName] = useState("");
  const [campusName, setCampusName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitDsoApplication({
        schoolName,
        campusName,
        contactName,
        contactEmail,
        contactPhone,
        websiteUrl,
        notes,
        website,
      });
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="font-semibold text-foreground">Submission received.</p>
        <p className="mt-1 text-sm text-muted">
          Thanks — we&apos;ll review this and update the listing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="School name">
        <input
          type="text"
          required
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className={inputClass}
          placeholder="Must match the school's SEVP-certified name"
        />
      </Field>
      <Field label="Campus name (optional)">
        <input
          type="text"
          value={campusName}
          onChange={(e) => setCampusName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Your name">
        <input
          type="text"
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className={inputClass}
          placeholder="e.g. the school's Designated School Official"
        />
      </Field>
      <Field label="Contact email">
        <input
          type="email"
          required
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Contact phone (optional)">
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="International student office website (optional)">
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={inputClass}
          placeholder="https://"
        />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </Field>
      {/* Honeypot — hidden from real visitors via CSS, not a type="hidden"
          input a form-filling bot would recognize and skip. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
