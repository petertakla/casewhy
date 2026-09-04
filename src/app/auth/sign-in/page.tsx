"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Something went wrong sending the link. Please try again.");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        We&apos;ll email you a link — no password needed.
      </p>

      {status === "sent" ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Check your email for a sign-in link.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email address"
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send sign-in link"}
          </button>
          {status === "error" && errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </form>
      )}
    </main>
  );
}
