import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttorneyBySlug } from "@/lib/attorneys/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const attorney = await getAttorneyBySlug(id);
  if (!attorney) return { title: "Attorney not found | CaseWhy" };
  return {
    title: `${attorney.name}${attorney.firm ? ` — ${attorney.firm}` : ""} | CaseWhy`,
    description: `Immigration attorney listing for ${attorney.name}${attorney.firm ? ` of ${attorney.firm}` : ""}, licensed in ${attorney.statesLicensed.join(", ")}. Free directory, informational listing only.`,
  };
}

// Round 40 — now reads a real DB table by slug rather than the static
// array's id field. Directory param name kept as [id] (unchanged route)
// even though the lookup is by slug now, to avoid touching every existing
// link into this route for a rename that carries no user-facing benefit.
export default async function AttorneyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const attorney = await getAttorneyBySlug(id);
  if (!attorney) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/attorneys" label={es ? "Todos los abogados" : "All attorneys"} />
        <Link href={localeToggleHref(`/attorneys/${attorney.slug}`, {}, es)} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          {es ? "English" : "Español"}
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{attorney.name}</h1>
      {attorney.firm && <p className="mt-1 text-muted">{attorney.firm}</p>}

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Estados con licencia" : "States licensed"}</p>
          <p className="mt-1">{attorney.statesLicensed.join(", ")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Área de práctica" : "Practice focus"}</p>
          <p className="mt-1">{attorney.practiceFocus.join(", ")}</p>
        </div>
        {(attorney.streetAddress || attorney.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Oficina" : "Office"}</p>
            <p className="mt-1">
              {attorney.streetAddress && <>{attorney.streetAddress}<br /></>}
              {attorney.cityStateZip}
            </p>
          </div>
        )}
        {attorney.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Teléfono" : "Phone"}</p>
            <p className="mt-1">{attorney.phone}</p>
          </div>
        )}
      </div>

      {attorney.websiteUrl && (
        <a
          href={attorney.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {es ? "Visitar sitio web" : "Visit website"}
        </a>
      )}

      {attorney.sourceCitation && <p className="mt-6 text-xs text-muted">{attorney.sourceCitation}</p>}
      <p className="mt-2 text-xs text-muted">
        {es
          ? "Este es un listado informativo, no un aval ni un servicio de referencia. Siempre confirma tú mismo la vigencia actual de la licencia antes de contratar a alguien."
          : "This is an informational listing, not an endorsement or a referral service. Always confirm current bar standing yourself before hiring anyone."}
      </p>

      <div className="mt-6">
        <VerificationLinks
          name={attorney.name}
          context={[attorney.firm, attorney.cityStateZip, "immigration attorney"].filter(Boolean).join(" ")}
          es={es}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/attorneys/${attorney.slug}`}
          title={attorney.name}
          text={
            es
              ? `Encontré esto en CaseWhy — ${attorney.name}, un listado gratuito de directorio de abogados de inmigración — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${attorney.name}, a free immigration attorney directory listing — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="attorney"
          entityId={attorney.id}
          entityName={attorney.name}
          labels={
            es
              ? {
                  trigger: "¿Ves algo incorrecto en este listado? Repórtalo",
                  success: "Gracias — lo revisaremos.",
                  whatsWrong: "¿Qué está mal en este listado?",
                  whatsWrongPlaceholder: "ej. el teléfono está desconectado, ya no está en esta dirección, la organización cerró",
                  email: "Tu correo (opcional, si quieres una respuesta)",
                  sending: "Enviando…",
                  send: "Enviar reporte",
                  cancel: "Cancelar",
                  defaultError: "Algo salió mal. Por favor intenta de nuevo.",
                }
              : undefined
          }
        />
      </div>
    </main>
  );
}
