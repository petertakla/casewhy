"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const MIN_PASSWORD_LENGTH = 8;

function SignUpForm() {
  const router = useRouter();
  const es = useIsSpanish();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        es ? `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(es ? "Las contraseñas no coinciden." : "Passwords don't match.");
      return;
    }

    setStatus("loading");
    try {
      const { error } = await authClient.signUp.email({ email, password, name: "" });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || (es ? "Algo salió mal al crear tu cuenta." : "Something went wrong creating your account."));
        return;
      }
      router.push(es ? "/dashboard?lang=es" : "/dashboard");
    } catch {
      setStatus("error");
      setErrorMessage(es ? "Algo salió mal al crear tu cuenta. Por favor intenta de nuevo." : "Something went wrong creating your account. Please try again.");
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <LanguageSwitcher es={es} href={localeToggleHref("/auth/sign-up", {}, es)} />
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
          <h1 className="text-2xl font-bold tracking-tight">{es ? "Crea tu cuenta" : "Create your account"}</h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
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
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={es ? `Contraseña (mín. ${MIN_PASSWORD_LENGTH} caracteres)` : `Password (min. ${MIN_PASSWORD_LENGTH} characters)`}
              autoComplete="new-password"
              className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
            />
            <label htmlFor="confirm-password" className="sr-only">
              {es ? "Confirmar contraseña" : "Confirm password"}
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={es ? "Confirmar contraseña" : "Confirm password"}
              autoComplete="new-password"
              className="rounded-lg border border-border-strong bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {status === "loading" ? (es ? "Creando cuenta…" : "Creating account…") : es ? "Crear cuenta" : "Create account"}
            </button>
            {status === "error" && errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            <p className="text-center text-xs text-muted">
              {es ? (
                <>¿Ya tienes una cuenta?{" "}
                  <Link href="/auth/sign-in?lang=es" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    Iniciar sesión
                  </Link>
                </>
              ) : (
                <>Already have an account?{" "}
                  <Link href="/auth/sign-in" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
