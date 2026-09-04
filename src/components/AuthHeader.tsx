"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function AuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  return (
    <header className="flex items-center justify-end gap-4 px-6 py-4 text-sm">
      {isPending ? null : session?.user ? (
        <>
          <span className="text-neutral-500">{session.user.email}</span>
          <button
            type="button"
            onClick={() => authClient.signOut().then(() => router.refresh())}
            className="font-semibold text-brand-600 dark:text-brand-500 hover:underline"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/auth/sign-in"
          className="font-semibold text-brand-600 dark:text-brand-500 hover:underline"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
