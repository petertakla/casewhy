import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProBonoRepresentationBySlug } from "@/lib/pro-bono-representation/directory";
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
  const org = await getProBonoRepresentationBySlug(slug);
  if (!org) return { title: es ? "Organización no encontrada | CaseWhy" : "Organization not found | CaseWhy" };
  return {
    title: es
      ? `${org.organizationName} — Representación Gratuita en la Corte de Inmigración | CaseWhy`
      : `${org.organizationName} — Pro Bono Immigration Court Representation | CaseWhy`,
    description: es
      ? `${org.organizationName}, ofreciendo representación gratuita ante la corte de inmigración de ${org.immigrationCourt}. Directorio gratuito, solo listado informativo.`
      : `${org.organizationName}, offering free representation before the ${org.immigrationCourt} immigration court. Free directory, informational listing only.`,
    alternates: {
      languages: {
        en: `https://app.casewhy.com/pro-bono-representation/${org.slug}`,
        es: `https://app.casewhy.com/pro-bono-representation/${org.slug}?lang=es`,
      },
    },
  };
}

export default async function ProBonoRepresentationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const org = await getProBonoRepresentationBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/pro-bono-representation" label={es ? "Toda la representación gratuita" : "All pro bono representation"} />
        <LanguageSwitcher es={es} basePath={`/pro-bono-representation/${org.slug}`} variant="inline" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {org.organizationName}
        {org.isReferralService && (
          <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 align-middle text-xs font-normal text-muted">
            {es ? "Servicio de referencia" : "Referral service"}
          </span>
        )}
      </h1>
      <p className="mt-1 text-muted">{org.immigrationCourt}</p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        {(org.streetAddress || org.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Dirección" : "Address"}</p>
            <p className="mt-1">
              {org.streetAddress && <>{org.streetAddress}<br /></>}
              {org.cityStateZip}
            </p>
          </div>
        )}
        {org.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Teléfono" : "Phone"}</p>
            <p className="mt-1">{org.phone}</p>
          </div>
        )}
        {org.languages && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Idiomas" : "Languages"}</p>
            <p className="mt-1">{org.languages}</p>
          </div>
        )}
        {org.caseTypeLimits && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Límites de tipo de caso" : "Case-type limits"}</p>
            <p className="mt-1">{org.caseTypeLimits}</p>
          </div>
        )}
        {org.intakePolicy && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Política de admisión" : "Intake policy"}</p>
            <p className="mt-1">{org.intakePolicy}</p>
          </div>
        )}
      </div>

      {org.website && (
        <a
          href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {es ? "Visitar sitio web" : "Visit website"}
        </a>
      )}

      <p className="mt-6 text-xs text-muted">{org.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        {es
          ? "EOIR no avala a ninguna de estas organizaciones, servicios de referencia, o abogados. La publicación de esta lista no constituye un aval por parte de EOIR, y su omisión no constituye una desaprobación. EOIR no participa en, ni es responsable de, las decisiones de representación o el desempeño de los abogados en esta lista. Siempre confirma los detalles actuales directamente con la organización antes de confiar en alguien."
          : "EOIR does not endorse any of these organizations, referral services, or attorneys. Publication of this list does not constitute an endorsement by EOIR, and omission does not constitute a disapproval. EOIR does not participate in, nor is it responsible for, the representation decisions or performance of counsel on this list. Always confirm current details directly with the organization before relying on anyone."}
      </p>

      <div className="mt-6">
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} es={es} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/pro-bono-representation/${org.slug}`}
          title={org.organizationName}
          text={
            es
              ? `Encontré esto en CaseWhy — ${org.organizationName}, representación gratuita para ${org.immigrationCourt} — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${org.organizationName}, free pro bono representation for ${org.immigrationCourt} — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="pro_bono_representation"
          entityId={org.id}
          entityName={org.organizationName}
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
