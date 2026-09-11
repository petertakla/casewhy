import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getStalePolicies } from "@/lib/policy/acknowledgments";
import { acknowledgeStalePolicies } from "./actions";

const POLICY_LABELS = { tos: "Terms of Service", privacy: "Privacy Policy" } as const;
const POLICY_HREFS = {
  tos: "https://casewhy.com/terms.html",
  privacy: "https://casewhy.com/privacy.html",
} as const;

export const dynamic = "force-dynamic";

export default async function PolicyUpdatePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const stale = await getStalePolicies(session.user.id, new Date(session.user.createdAt));
  if (stale.length === 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">We&apos;ve updated our policies</h1>
      <p className="mb-8 mt-2 text-muted">
        Before you continue, please review what changed. You&apos;ll need to acknowledge this to
        keep using your account.
      </p>

      <div className="space-y-5">
        {stale.map((policy) => (
          <div key={policy.type} className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {POLICY_LABELS[policy.type]} — updated {policy.version}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {policy.summary.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <a
              href={POLICY_HREFS[policy.type]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              Read the full {POLICY_LABELS[policy.type]} →
            </a>
          </div>
        ))}
      </div>

      <form action={acknowledgeStalePolicies} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          I acknowledge these changes
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Questions? <a href="mailto:privacy@casewhy.com" className="text-brand-600 hover:underline dark:text-brand-400">privacy@casewhy.com</a>
      </p>
    </main>
  );
}
