import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getEnabledNewsSourceIds } from "@/lib/settings/settings";
import { fetchNews } from "@/lib/news/fetch-news";
import { newsItemId } from "@/lib/news/permalink";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { ShareButton } from "@/components/ShareButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Round 83 — same static-metadata gap as processing-times/visa-bulletin.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  return es
    ? {
        title: "Noticias de Inmigración — Actualizaciones de USCIS y Políticas | CaseWhy",
        description:
          "Anuncios curados de USCIS, cambios en reglas federales, y cobertura de ley de inmigración de un conjunto curado de fuentes, actualizado regularmente.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/news",
            es: "https://app.casewhy.com/news?lang=es",
          },
        },
      }
    : {
        title: "Immigration News — USCIS & Policy Updates | CaseWhy",
        description:
          "Curated USCIS announcements, federal rule changes, and immigration-law coverage from a curated set of sources, updated regularly.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/news",
            es: "https://app.casewhy.com/news?lang=es",
          },
        },
      };
}

function formatDate(date: Date | null, es: boolean): string {
  if (!date) return "";
  return date.toLocaleDateString(es ? "es" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const { data: session } = await auth.getSession();
  const enabledSourceIds = await getEnabledNewsSourceIds(session?.user?.id ?? null);
  const { items, failedSources } = await fetchNews(enabledSourceIds);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} href={localeToggleHref("/news", {}, es)} />
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Noticias de inmigración" : "Immigration news"}</h1>
      <p className="mb-8 mt-2 text-muted">
        {es
          ? "Anuncios de USCIS, cambios en reglas federales, y cobertura de ley de inmigración de un conjunto curado de fuentes."
          : "USCIS announcements, federal rule changes, and immigration-law coverage from a curated set of sources."}
        {session?.user && (
          <>
            {" "}
            {es ? (
              <>
                Elige qué fuentes aparecen aquí desde{" "}
                <a href={es ? "/settings?lang=es" : "/settings"} className="text-brand-600 dark:text-brand-400 hover:underline">
                  Configuración
                </a>
                .
              </>
            ) : (
              <>
                Pick which sources show up here from{" "}
                <a href="/settings" className="text-brand-600 dark:text-brand-400 hover:underline">
                  Settings
                </a>
                .
              </>
            )}
          </>
        )}
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/news"
          title="CaseWhy — Immigration news"
          text={es ? "Noticias curadas de USCIS y ley de inmigración, gratis, con CaseWhy." : "Curated USCIS and immigration-law news, for free, with CaseWhy."}
          es={es}
        />
      </div>

      {/* Round 80 follow-up — item.sourceName/.title/.link are real RSS
          content from USCIS/Federal Register/etc., Track 2 by the same
          reasoning as raw USCIS status text — never translated. Only the
          page's own chrome and the round-66 quick-ask link labels are. */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">
          {es ? "Ninguna noticia disponible en este momento — vuelve a revisar pronto." : "No stories available right now — check back shortly."}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.sourceId}-${item.link}`}
              className="rounded-xl border border-border bg-surface p-5 hover:border-brand-500/50"
            >
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {item.sourceName}
                  {item.publishedAt && <span> · {formatDate(item.publishedAt, es)}</span>}
                </p>
                <p className="mt-1.5 font-semibold text-foreground">{item.title}</p>
              </a>
              <div className="mt-2 flex items-center justify-between text-xs font-medium">
                <Link
                  href={`/ask?link=${encodeURIComponent(`/news/${newsItemId(item)}`)}&ask=applies${es ? "&lang=es" : ""}`}
                  className="text-brand-600 hover:underline dark:text-brand-400"
                >
                  {es ? "¿Aplica a mi caso?" : "Does it apply to me?"}
                </Link>
                <Link
                  href={`/ask?link=${encodeURIComponent(`/news/${newsItemId(item)}`)}&ask=explains${es ? "&lang=es" : ""}`}
                  className="text-brand-600 hover:underline dark:text-brand-400"
                >
                  {es ? "¿Cómo aplica a mi caso?" : "How it applies to me?"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {failedSources.length > 0 && (
        <p className="mt-6 text-xs text-muted">
          {es ? "Temporalmente no disponible: " : "Temporarily unavailable: "}
          {failedSources.join(", ")}.
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        {es
          ? "CaseWhy no escribe ni edita esta cobertura — cada noticia enlaza a su fuente original. No es asesoría legal."
          : "CaseWhy doesn't write or edit this coverage — each story links to its original source. Not legal advice."}
      </p>
    </main>
  );
}
