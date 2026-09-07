"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    // redirectTo must be an absolute, trusted URL (Neon Auth's Domains
    // allowlist) — origin is read from the browser at submit time so this
    // works correctly on both app.casewhy.com and any preview deployment
    // already added to that allowlist.
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error } = await authClient.requestPasswordReset({ email, redirectTo });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path
                d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2Zm10-11V7a4 4 0 1 0-8 0v2"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="mt-2 text-muted">We&apos;ll email you a link to reset it.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium">Check your email</p>
              <p className="mt-1 text-sm text-muted">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve
                sent a password-reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send reset link"}
              </button>
              {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
              <p className="text-center text-xs text-muted">
                <Link href="/auth/sign-in" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
