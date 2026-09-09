"use client";

import { useState, useTransition } from "react";
import { submitCommunityOrgApplication } from "./actions";

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
  const [organizationName, setOrganizationName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [statesServed, setStatesServed] = useState("");
  const [populationServed, setPopulationServed] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitCommunityOrgApplication({
        organizationName,
        orgType,
        contactPerson,
        statesServed,
        populationServed,
        servicesOffered,
        contactEmail,
        contactPhone,
        websiteUrl,
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
        <p className="font-semibold text-foreground">Application received.</p>
        <p className="mt-1 text-sm text-muted">
          Thanks — we&apos;ll review your organization and be in touch before listing you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Organization name">
        <input
          type="text"
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Asian Community Development Council"
        />
      </Field>
      <Field label="Organization type">
        <input
          type="text"
          required
          value={orgType}
          onChange={(e) => setOrgType(e.target.value)}
          className={inputClass}
          placeholder="e.g. Community center, cultural association, church ministry"
        />
      </Field>
      <Field label="Contact person">
        <input
          type="text"
          required
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="States or regions served">
        <input
          type="text"
          required
          value={statesServed}
          onChange={(e) => setStatesServed(e.target.value)}
          className={inputClass}
          placeholder="e.g. NV, or Nationwide (virtual)"
        />
      </Field>
      <Field label="Community served">
        <input
          type="text"
          required
          value={populationServed}
          onChange={(e) => setPopulationServed(e.target.value)}
          className={inputClass}
          placeholder="e.g. Vietnamese immigrant community, Afghan refugees"
        />
      </Field>
      <Field label="Services offered">
        <textarea
          required
          rows={2}
          value={servicesOffered}
          onChange={(e) => setServicesOffered(e.target.value)}
          className={inputClass}
          placeholder="e.g. Citizenship classes, ESL, community events, cultural programming"
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
      <Field label="Website (optional)">
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={inputClass}
          placeholder="https://"
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
        {isPending ? "Submitting…" : "Submit application"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
