"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Logo } from "./Logo";

export function AuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/">
          <Logo />
        </Link>

        {isPending ? null : session?.user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-muted">{session.user.email}</span>
            <button
              type="button"
              onClick={() => authClient.signOut().then(() => router.refresh())}
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/auth/sign-in"
            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
