import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccreditedRepresentativeBySlug } from "@/lib/accredited-representatives/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Complete-check follow-up — see attorneys/[id]/page.tsx's identical fix.
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const rep = await getAccreditedRepresentativeBySlug(slug);
  if (!rep) return { title: es ? "Representante no encontrado | CaseWhy" : "Representative not found | CaseWhy" };
  return {
    title: `${rep.representativeName} — ${rep.organizationName} | CaseWhy`,
    description: es
      ? `Representante acreditado por el DOJ, ${rep.representativeName} en ${rep.organizationName}. Directorio gratuito, solo listado informativo.`
      : `DOJ-accredited representative ${rep.representativeName} at ${rep.organizationName}. Free directory, informational listing only.`,
    alternates: {
      languages: {
        en: `https://app.casewhy.com/accredited-representatives/${rep.slug}`,
        es: `https://app.casewhy.com/accredited-representatives/${rep.slug}?lang=es`,
      },
    },
  };
}

export default async function AccreditedRepresentativeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const rep = await getAccreditedRepresentativeBySlug(slug);
  if (!rep) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/accredited-representatives" label={es ? "Todos los representantes acreditados" : "All accredited representatives"} />
        <LanguageSwitcher es={es} basePath={`/accredited-representatives/${rep.slug}`} variant="inline" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{rep.representativeName}</h1>
      <p className="mt-1 text-muted">{rep.organizationName}</p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Acreditación" : "Accreditation"}</p>
          <p className="mt-1">
            {rep.dhsOnly ? (es ? "Solo DHS" : "DHS only") : (es ? "Acreditación completa" : "Full accreditation")}
            {rep.accreditationExpiration && (
              <>
                {" "}
                {es ? `— expira ${rep.accreditationExpiration}` : `— expires ${rep.accreditationExpiration}`}
                {rep.accreditationPendingRenewal && (es ? " (renovación pendiente)" : " (renewal pending)")}
              </>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Estado de la organización" : "Organization status"}</p>
          <p className="mt-1">
            {rep.organizationStatus}
            {rep.organizationRecognitionExpiration && (
              <>
                {" "}
                {es
                  ? `— el reconocimiento expira ${rep.organizationRecognitionExpiration}`
                  : `— recognition expires ${rep.organizationRecognitionExpiration}`}
                {rep.organizationRecognitionPendingRenewal && (es ? " (renovación pendiente)" : " (renewal pending)")}
              </>
            )}
          </p>
        </div>
        {(rep.officeType || rep.streetAddress || rep.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Oficina" : "Office"}</p>
            <p className="mt-1">
              {rep.officeType && <>{rep.officeType}<br /></>}
              {rep.streetAddress && <>{rep.streetAddress}<br /></>}
              {rep.cityStateZip}
            </p>
          </div>
        )}
        {rep.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Teléfono" : "Phone"}</p>
            <p className="mt-1">{rep.phone}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted">{rep.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        {es ? (
          <>
            Este es un listado informativo, no un aval ni un servicio de referencia. Siempre confirma
            la acreditación actual tú mismo antes de confiar en alguien —{" "}
            <a
              href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              el propio registro del DOJ
            </a>
            .
          </>
        ) : (
          <>
            This is an informational listing, not an endorsement or a referral service. Always confirm
            current accreditation yourself before relying on anyone —{" "}
            <a
              href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              DOJ&apos;s own roster
            </a>
            .
          </>
        )}
      </p>

      <div className="mt-6">
        <VerificationLinks
          name={rep.representativeName}
          context={[rep.organizationName, rep.cityStateZip].filter(Boolean).join(" ")}
          es={es}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/accredited-representatives/${rep.slug}`}
          title={rep.representativeName}
          text={
            es
              ? `Encontré esto en CaseWhy — ${rep.representativeName} en ${rep.organizationName}, un listado gratuito de directorio de representantes acreditados por el DOJ — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${rep.representativeName} at ${rep.organizationName}, a free DOJ-accredited representative directory listing — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="accredited_representative"
          entityId={rep.id}
          entityName={rep.representativeName}
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
