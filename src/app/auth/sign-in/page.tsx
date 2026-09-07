"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
      <path
        d="M3 6.5 12 13l9-6.5M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm">
            <EnvelopeIcon />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}

function MagicLinkForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard" });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Something went wrong sending the link. Please try again.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-muted">We&apos;ll email you a link — no password needed.</p>
      <label htmlFor="magic-email" className="sr-only">
        Email address
      </label>
      <input
        id="magic-email"
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
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </button>
      {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      <button
        type="button"
        onClick={onBack}
        className="text-center text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        Sign in with a password instead
      </button>
    </form>
  );
}

function PasswordSignInForm({ onUseMagicLink }: { onUseMagicLink: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "Incorrect email or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
      />
      <Link
        href="/auth/forgot-password"
        className="-mt-1 text-right text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        Forgot password?
      </Link>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "loading" ? "Signing in…" : "Sign in"}
      </button>
      {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      <button
        type="button"
        onClick={onUseMagicLink}
        className="text-center text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        Sign in with an email link instead
      </button>
      <p className="text-center text-xs text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function SignInPage() {
  const [mode, setMode] = useState<"password" | "magic-link">("password");

  return (
    <AuthCard>
      {mode === "password" ? (
        <PasswordSignInForm onUseMagicLink={() => setMode("magic-link")} />
      ) : (
        <MagicLinkForm onBack={() => setMode("password")} />
      )}
    </AuthCard>
  );
}
