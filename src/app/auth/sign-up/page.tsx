"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    setStatus("loading");
    const { error } = await authClient.signUp.email({ email, password, name: "" });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Something went wrong creating your account.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
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
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`Password (min. ${MIN_PASSWORD_LENGTH} characters)`}
              autoComplete="new-password"
              className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
            />
            <label htmlFor="confirm-password" className="sr-only">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {status === "loading" ? "Creating account…" : "Create account"}
            </button>
            {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            <p className="text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
