"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";

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

function AuthCard({ children, es }: { children: React.ReactNode; es: boolean }) {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-2 text-right text-sm">
          <Link href={localeToggleHref("/auth/sign-in", {}, es)} className="text-brand-600 hover:underline dark:text-brand-400">
            {es ? "English" : "Español"}
          </Link>
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm">
            <EnvelopeIcon />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{es ? "Iniciar sesión" : "Sign in"}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}

function MagicLinkForm({
  onBack,
  dashboardHref,
  es,
}: {
  onBack: () => void;
  dashboardHref: string;
  es: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.magicLink({ email, callbackURL: dashboardHref });
      if (error) {
        setStatus("error");
        setErrorMessage(
          error.message || (es ? "Algo salió mal al enviar el enlace. Por favor intenta de nuevo." : "Something went wrong sending the link. Please try again.")
        );
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage(es ? "Algo salió mal al enviar el enlace. Por favor intenta de nuevo." : "Something went wrong sending the link. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium">{es ? "Revisa tu correo" : "Check your email"}</p>
        <p className="mt-1 text-sm text-muted">
          {es ? (
            <>Enviamos un enlace de inicio de sesión a <span className="font-medium text-foreground">{email}</span>.</>
          ) : (
            <>We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {es ? "Te enviaremos un enlace por correo — no necesitas contraseña." : "We'll email you a link — no password needed."}
      </p>
      <label htmlFor="magic-email" className="sr-only">
        {es ? "Correo electrónico" : "Email address"}
      </label>
      <input
        id="magic-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={es ? "tu@correo.com" : "you@example.com"}
        autoComplete="email"
        className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "sending" ? (es ? "Enviando…" : "Sending…") : es ? "Enviar enlace de inicio de sesión" : "Send sign-in link"}
      </button>
      {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      <button
        type="button"
        onClick={onBack}
        className="text-center text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {es ? "Iniciar sesión con contraseña en su lugar" : "Sign in with a password instead"}
      </button>
    </form>
  );
}

function PasswordSignInForm({
  onUseMagicLink,
  dashboardHref,
  es,
}: {
  onUseMagicLink: () => void;
  dashboardHref: string;
  es: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || (es ? "Correo o contraseña incorrectos." : "Incorrect email or password."));
        return;
      }
      router.push(dashboardHref);
    } catch {
      setStatus("error");
      setErrorMessage(es ? "Algo salió mal al iniciar sesión. Por favor intenta de nuevo." : "Something went wrong signing in. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="email" className="sr-only">
        {es ? "Correo electrónico" : "Email address"}
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={es ? "tu@correo.com" : "you@example.com"}
        autoComplete="email"
        className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
      />
      <label htmlFor="password" className="sr-only">
        {es ? "Contraseña" : "Password"}
      </label>
      <input
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={es ? "Contraseña" : "Password"}
        autoComplete="current-password"
        className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
      />
      <Link
        href={es ? "/auth/forgot-password?lang=es" : "/auth/forgot-password"}
        className="-mt-1 text-right text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
      </Link>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "loading" ? (es ? "Iniciando sesión…" : "Signing in…") : es ? "Iniciar sesión" : "Sign in"}
      </button>
      {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      <button
        type="button"
        onClick={onUseMagicLink}
        className="text-center text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {es ? "Iniciar sesión con un enlace por correo en su lugar" : "Sign in with an email link instead"}
      </button>
      <p className="text-center text-xs text-muted">
        {es ? (
          <>¿No tienes una cuenta?{" "}
            <Link href="/auth/sign-up?lang=es" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Regístrate
            </Link>
          </>
        ) : (
          <>Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign up
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function SignInForms() {
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  // Round 79 follow-up 3 — carries the "came from an /es/* page" signal
  // straight through the sign-in redirect via a query param instead of
  // relying on the AuthHeader's cookie write having landed before the
  // click. The cookie approach still covers ordinary nav clicks; this
  // covers the one hop (sign-in form submit -> /dashboard) that's a real
  // network round-trip away from the page the cookie was set on, where a
  // timing assumption is worth not needing at all.
  const es = useIsSpanish();
  const dashboardHref = es ? "/dashboard?lang=es" : "/dashboard";

  return (
    <AuthCard es={es}>
      {mode === "password" ? (
        <PasswordSignInForm onUseMagicLink={() => setMode("magic-link")} dashboardHref={dashboardHref} es={es} />
      ) : (
        <MagicLinkForm onBack={() => setMode("password")} dashboardHref={dashboardHref} es={es} />
      )}
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForms />
    </Suspense>
  );
}
