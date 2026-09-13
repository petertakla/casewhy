import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalAidBySlug } from "@/lib/legal-aid/directory";
import { BackLink } from "@/components/BackLink";
import { ReportListingLink } from "@/components/ReportListingLink";
import { ShareButton } from "@/components/ShareButton";
import { VerificationLinks } from "@/components/VerificationLinks";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getLegalAidBySlug(slug);
  if (!org) return { title: "Organization not found | CaseWhy" };
  return {
    title: `${org.organizationName} — Free Legal Aid | CaseWhy`,
    description: `${org.organizationName}, a nonprofit immigration legal aid organization. Free directory, informational listing only.`,
  };
}

export default async function LegalAidDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const org = await getLegalAidBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/legal-aid" label={es ? "Todas las organizaciones de asistencia legal" : "All legal aid organizations"} />
        <Link href={localeToggleHref(`/legal-aid/${org.slug}`, {}, es)} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          {es ? "English" : "Español"}
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{org.organizationName}</h1>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Estado de reconocimiento" : "Recognition status"}</p>
          <p className="mt-1">
            {org.organizationStatus}
            {org.organizationRecognitionExpiration && (
              <>
                {" "}
                {es
                  ? `— el reconocimiento expira ${org.organizationRecognitionExpiration}`
                  : `— recognition expires ${org.organizationRecognitionExpiration}`}
                {org.organizationRecognitionPendingRenewal && (es ? " (renovación pendiente)" : " (renewal pending)")}
              </>
            )}
          </p>
        </div>
        {(org.officeType || org.streetAddress || org.cityStateZip) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Oficina" : "Office"}</p>
            <p className="mt-1">
              {org.officeType && <>{org.officeType}<br /></>}
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
        {org.servicesOffered && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Servicios ofrecidos" : "Services offered"}</p>
            <p className="mt-1">{org.servicesOffered}</p>
          </div>
        )}
        {org.populationServed && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Población atendida" : "Population served"}</p>
            <p className="mt-1">{org.populationServed}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted">{org.sourceCitation}</p>
      <p className="mt-2 text-xs text-muted">
        {es ? (
          <>
            Este es un listado informativo, no un aval ni un servicio de referencia. Siempre confirma
            los detalles actuales directamente antes de confiar en alguien —{" "}
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
            current details yourself before relying on anyone —{" "}
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
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} es={es} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/legal-aid/${org.slug}`}
          title={org.organizationName}
          text={
            es
              ? `Encontré esto en CaseWhy — ${org.organizationName}, un recurso gratuito/de bajo costo de asistencia legal — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${org.organizationName}, a free/low-cost legal aid resource — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="legal_aid"
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
