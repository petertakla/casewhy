"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ask", label: "Ask a question" },
  { href: "/processing-times", label: "Processing times" },
  { href: "/visa-bulletin", label: "Visa bulletin" },
  { href: "/plus", label: "CaseWhy Plus" },
];

export function AuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const onAppPage = NAV_LINKS.some((link) => pathname.startsWith(link.href));

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 text-sm">
        <Link href="/">
          <Logo />
        </Link>

        {onAppPage && (
          <nav className="order-3 flex w-full gap-x-5 gap-y-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap pb-0.5 ${
                    active
                      ? "border-b-2 border-brand-500 font-semibold text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

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
