"use client";

import { useState, useTransition } from "react";
import { updateStatusChangeEmails, updateNewsSource } from "./actions";
import type { NewsSource } from "@/lib/news/sources";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-brand-500"
      />
    </label>
  );
}

export function SettingsForm({
  initialStatusChangeEmailsEnabled,
  newsSources,
  initialEnabledSourceIds,
}: {
  initialStatusChangeEmailsEnabled: boolean;
  newsSources: NewsSource[];
  initialEnabledSourceIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [statusChangeEmails, setStatusChangeEmails] = useState(initialStatusChangeEmailsEnabled);
  const [enabledSourceIds, setEnabledSourceIds] = useState(new Set(initialEnabledSourceIds));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Notifications
        </h2>
        <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-5">
          <ToggleRow
            label="Email me when a tracked case's status changes"
            description="Sent to the email on your account, once per status change."
            checked={statusChangeEmails}
            onChange={(checked) => {
              setStatusChangeEmails(checked);
              startTransition(async () => {
                await updateStatusChangeEmails(checked);
              });
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          News sources
        </h2>
        <p className="mt-2 text-xs text-muted">Choose which sources show up on the News page.</p>
        <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-5">
          {newsSources.map((source) => (
            <ToggleRow
              key={source.id}
              label={source.name}
              checked={enabledSourceIds.has(source.id)}
              onChange={(checked) => {
                setEnabledSourceIds((prev) => {
                  const next = new Set(prev);
                  if (checked) next.add(source.id);
                  else next.delete(source.id);
                  return next;
                });
                startTransition(async () => {
                  await updateNewsSource(source.id, checked);
                });
              }}
            />
          ))}
        </div>
      </section>

      {isPending && <p className="text-xs text-muted">Saving…</p>}
    </div>
  );
}
