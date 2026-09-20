"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordInput } from "@/components/PasswordInput";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const es = useIsSpanish();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(es ? "Este enlace de restablecimiento falta o no es válido. Solicita uno nuevo." : "This reset link is missing or invalid. Request a new one.");
      setStatus("error");
      return;
    }
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
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) {
        setStatus("error");
        setErrorMessage(
          error.message || (es ? "Este enlace de restablecimiento no es válido o ha expirado. Solicita uno nuevo." : "This reset link is invalid or has expired. Request a new one.")
        );
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage(es ? "Algo salió mal. Solicita un nuevo enlace y vuelve a intentarlo." : "Something went wrong. Request a new reset link and try again.");
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <LanguageSwitcher es={es} href={localeToggleHref("/auth/reset-password", { token: token ?? undefined }, es)} />
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
          <h1 className="text-2xl font-bold tracking-tight">{es ? "Establece una nueva contraseña" : "Set a new password"}</h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {status === "done" ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium">{es ? "Contraseña actualizada" : "Password updated"}</p>
              <button
                type="button"
                onClick={() => router.push(es ? "/auth/sign-in?lang=es" : "/auth/sign-in")}
                className="mt-4 w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {es ? "Iniciar sesión" : "Sign in"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label htmlFor="password" className="sr-only">
                {es ? "Nueva contraseña" : "New password"}
              </label>
              <PasswordInput
                id="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={es ? `Nueva contraseña (mín. ${MIN_PASSWORD_LENGTH} caracteres)` : `New password (min. ${MIN_PASSWORD_LENGTH} characters)`}
                autoComplete="new-password"
                showLabel={es ? "Mostrar contraseña" : "Show password"}
                hideLabel={es ? "Ocultar contraseña" : "Hide password"}
              />
              <label htmlFor="confirm-password" className="sr-only">
                {es ? "Confirmar nueva contraseña" : "Confirm new password"}
              </label>
              <PasswordInput
                id="confirm-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={es ? "Confirmar nueva contraseña" : "Confirm new password"}
                autoComplete="new-password"
                showLabel={es ? "Mostrar contraseña" : "Show password"}
                hideLabel={es ? "Ocultar contraseña" : "Hide password"}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {status === "loading" ? (es ? "Actualizando…" : "Updating…") : es ? "Actualizar contraseña" : "Update password"}
              </button>
              {status === "error" && errorMessage && (
                <p className="text-sm text-red-500">
                  {errorMessage}{" "}
                  <Link href={es ? "/auth/forgot-password?lang=es" : "/auth/forgot-password"} className="font-semibold underline">
                    {es ? "Solicitar un nuevo enlace" : "Request a new link"}
                  </Link>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
