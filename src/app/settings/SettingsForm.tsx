"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { updateStatusChangeEmails, updateNewsSource } from "./actions";
import type { NewsSource } from "@/lib/news/sources";
import {
  urlBase64ToUint8Array,
  isIosNotInstalled,
  isPushSupported,
  detectBrowser,
  NOTIFICATION_BLOCKED_HELP,
} from "@/lib/push/client";

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

/**
 * Round 26 — unlike the email toggle, there's no server-known "is push
 * enabled" boolean for this exact browser: the server only knows which
 * endpoints exist, and the browser is the only side that can say whether
 * *this* service-worker registration currently has one. So this toggle's
 * checked-state is determined client-side on mount via
 * pushManager.getSubscription(), not passed in as an initial prop.
 */
function PushNotificationsRow() {
  const [status, setStatus] = useState<
    "checking" | "unsupported" | "ios-not-installed" | "denied" | "off" | "on"
  >("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedHelp, setBlockedHelp] = useState<
    (typeof NOTIFICATION_BLOCKED_HELP)[keyof typeof NOTIFICATION_BLOCKED_HELP] | null
  >(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (isIosNotInstalled()) {
      setStatus("ios-not-installed");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      setBlockedHelp(NOTIFICATION_BLOCKED_HELP[detectBrowser()]);
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setBlockedHelp(NOTIFICATION_BLOCKED_HELP[detectBrowser()]);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error();
      setStatus("on");
    } catch {
      setError("Couldn't enable push notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("Couldn't disable push notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="py-3 text-xs text-muted">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (status === "ios-not-installed") {
    return (
      <p className="py-3 text-xs text-muted">
        On iPhone/iPad, add CaseWhy to your home screen first (Share → Add to Home Screen) to
        enable push notifications — Safari doesn&apos;t support them in a regular browser tab.
      </p>
    );
  }

  return (
    <div className="py-3">
      <label className="flex cursor-pointer items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-foreground">
            Enable push notifications
          </span>
          <span className="block text-xs text-muted">
            Get a notification on this device the moment a tracked case&apos;s status changes.
          </span>
        </span>
        <input
          type="checkbox"
          checked={status === "on"}
          disabled={busy || status === "denied"}
          onChange={(e) => (e.target.checked ? enable() : disable())}
          className="mt-1 h-4 w-4 shrink-0 accent-brand-500 disabled:opacity-60"
        />
      </label>
      {status === "denied" && (
        <div className="mt-1">
          <p className="text-xs text-red-500">
            Notifications are blocked for this site in your browser settings. Allow notifications
            for casewhy.com to turn this on.
          </p>
          {blockedHelp && (
            <p className="mt-1 text-xs text-muted">
              {blockedHelp.instructions}
              {blockedHelp.helpUrl && (
                <>
                  {" "}
                  <a
                    href={blockedHelp.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Learn more
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const APPEARANCE_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/**
 * Round 54 — a real override on top of the OS's prefers-color-scheme, not
 * just following it. `theme` is undefined until after mount (next-themes
 * avoids guessing on the server to prevent a hydration mismatch), so this
 * renders a disabled placeholder for one tick rather than flash a wrong
 * selection.
 */
function AppearanceRow() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="py-3">
      <span className="block text-sm font-medium text-foreground">Appearance</span>
      <span className="block text-xs text-muted">
        System follows your device&apos;s setting automatically.
      </span>
      <div className="mt-2 inline-flex rounded-lg border border-border-strong p-1">
        {APPEARANCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={!mounted}
            onClick={() => setTheme(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              mounted && theme === option.value
                ? "bg-brand-500 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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
          Appearance
        </h2>
        <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-5">
          <AppearanceRow />
        </div>
      </section>

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
          <PushNotificationsRow />
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
