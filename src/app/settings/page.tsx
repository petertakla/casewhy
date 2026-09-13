import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getStatusChangeEmailsEnabled, getEnabledNewsSourceIds } from "@/lib/settings/settings";
import { NEWS_SOURCES } from "@/lib/news/sources";
import { RESOURCE_LINKS } from "@/lib/resources/links";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);

  const [statusChangeEmailsEnabled, enabledSourceIds] = await Promise.all([
    getStatusChangeEmailsEnabled(session.user.id),
    getEnabledNewsSourceIds(session.user.id),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Configuración" : "Settings"}</h1>
      <p className="mb-8 mt-2 text-muted">
        {es
          ? "Preferencias de notificaciones, fuentes de noticias, y enlaces útiles."
          : "Notification preferences, news sources, and useful links."}
      </p>

      {/* Round 80 follow-up — SettingsForm.tsx is now translated too. It
          still has round 75's own paused, uncommitted work sitting in it
          (push-notification-blocked help clarity, on hold "until further
          notice"); that specific block (the blockedHelp instructions/steps
          rendering) was left untouched — everything else in the file was
          safe to translate around it. */}
      <SettingsForm
        initialStatusChangeEmailsEnabled={statusChangeEmailsEnabled}
        newsSources={NEWS_SOURCES}
        initialEnabledSourceIds={[...enabledSourceIds]}
        es={es}
      />

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          {es ? "Enlaces útiles" : "Useful links"}
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
