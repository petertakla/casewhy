import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import { notFound } from "next/navigation";
import { getDsoBySlug } from "@/lib/dso/directory";
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
  const school = await getDsoBySlug(slug);
  if (!school)
    return {
      title: es
        ? "Escuela no encontrada | CaseWhy"
        : "School not found | CaseWhy",
    };
  const campusSuffix =
    school.campusName && school.campusName !== school.schoolName
      ? ` (${school.campusName})`
      : "";
  const languages = {
    en: `https://app.casewhy.com/dso/${school.slug}`,
    es: `https://app.casewhy.com/dso/${school.slug}?lang=es`,
  };
  return pageMetadata(
    es ? `/dso/${school.slug}?lang=es` : `/dso/${school.slug}`,
    {
      title: es
        ? `${school.schoolName} — Oficina de Estudiantes Internacionales | CaseWhy`
        : `${school.schoolName} — International Student Office | CaseWhy`,
      description: es
        ? `Listado de escuela certificada por SEVP para ${school.schoolName}${campusSuffix}. Directorio gratuito, solo listado informativo.`
        : `SEVP-certified school listing for ${school.schoolName}${campusSuffix}. Free directory, informational listing only.`,
      locale: es ? "es" : undefined,
      languages,
    },
  );
}

export default async function DsoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const school = await getDsoBySlug(slug);
  if (!school) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink
          href="/dso"
          label={es ? "Todas las escuelas" : "All schools"}
        />
        <LanguageSwitcher
          es={es}
          basePath={`/dso/${school.slug}`}
          variant="inline"
        />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {school.schoolName}
      </h1>
      {school.campusName && school.campusName !== school.schoolName && (
        <p className="mt-1 text-muted">
          {school.campusName}
          {school.isMainCampus
            ? es
              ? " (campus principal)"
              : " (main campus)"
            : ""}
        </p>
      )}

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Certificación SEVP" : "SEVP certification"}
          </p>
          <p className="mt-1">
            {[school.f1Certified && "F-1", school.m1Certified && "M-1"]
              .filter(Boolean)
              .join(es ? " y " : " and ")}
          </p>
        </div>
        {(school.streetAddress || school.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {es ? "Dirección" : "Address"}
            </p>
            <p className="mt-1">
              {school.streetAddress && (
                <>
                  {school.streetAddress}
                  <br />
                </>
              )}
              {school.cityStateZip}
            </p>
          </div>
        )}
        {school.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {es ? "Teléfono" : "Phone"}
            </p>
            <p className="mt-1">{school.phone}</p>
          </div>
        )}
      </div>

      {school.websiteUrl ? (
        <a
          href={school.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {es
            ? "Visitar sitio web de la oficina de estudiantes internacionales"
            : "Visit international student office website"}
        </a>
      ) : (
        <p className="mt-6 text-sm text-muted">
          {es ? (
            <>
              Aún no se ha confirmado un enlace directo a la oficina de
              estudiantes internacionales para esta escuela —{" "}
              <a
                href="https://studyinthestates.dhs.gov/school-search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline dark:text-brand-400"
              >
                busca en el propio directorio de escuelas del DHS
              </a>{" "}
              o contacta a la escuela directamente.
            </>
          ) : (
            <>
              A direct international-student-office link isn&apos;t confirmed
              for this school yet —{" "}
              <a
                href="https://studyinthestates.dhs.gov/school-search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline dark:text-brand-400"
              >
                search DHS&apos;s own school directory
              </a>{" "}
              or contact the school directly.
            </>
          )}
        </p>
      )}

      <p className="mt-6 text-xs text-muted">{school.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        {es
          ? "Este es un listado informativo, no un aval ni un servicio de referencia. Siempre confirma los detalles actuales directamente con la escuela antes de confiar en alguien."
          : "This is an informational listing, not an endorsement or a referral service. Always confirm current details directly with the school before relying on anyone."}
      </p>

      <div className="mt-6">
        <VerificationLinks
          name={school.schoolName}
          context={school.cityStateZip ?? undefined}
          es={es}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/dso/${school.slug}`}
          title={school.schoolName}
          text={
            es
              ? `Encontré esto en CaseWhy — el listado de la oficina de estudiantes internacionales de ${school.schoolName} — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${school.schoolName}'s international student office listing — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="dso"
          entityId={school.id}
          entityName={school.schoolName}
          labels={
            es
              ? {
                  trigger: "¿Ves algo incorrecto en este listado? Repórtalo",
                  success: "Gracias — lo revisaremos.",
                  whatsWrong: "¿Qué está mal en este listado?",
                  whatsWrongPlaceholder:
                    "ej. el teléfono está desconectado, ya no está en esta dirección, la organización cerró",
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
