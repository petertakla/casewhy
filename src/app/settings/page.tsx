import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getStatusChangeEmailsEnabled, getDisabledNewsSourceIds } from "@/lib/settings/settings";
import { NEWS_SOURCES } from "@/lib/news/sources";
import { RESOURCE_LINKS } from "@/lib/resources/links";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [statusChangeEmailsEnabled, disabledSourceIds] = await Promise.all([
    getStatusChangeEmailsEnabled(session.user.id),
    getDisabledNewsSourceIds(session.user.id),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mb-8 mt-2 text-muted">Notification preferences, news sources, and useful links.</p>

      <SettingsForm
        initialStatusChangeEmailsEnabled={statusChangeEmailsEnabled}
        newsSources={NEWS_SOURCES}
        initialDisabledSourceIds={[...disabledSourceIds]}
      />

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Useful links
        </h2>
        <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-5">
          {RESOURCE_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-3 hover:text-brand-600 dark:hover:text-brand-400"
            >
              <span className="block text-sm font-medium">{link.label}</span>
              <span className="block text-xs text-muted">{link.description}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
