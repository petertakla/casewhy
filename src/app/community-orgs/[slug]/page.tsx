import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityOrgBySlug } from "@/lib/community-orgs/directory";
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
  const org = await getCommunityOrgBySlug(slug);
  if (!org) return { title: es ? "Organización no encontrada | CaseWhy" : "Organization not found | CaseWhy" };
  return {
    title: es ? `${org.organizationName} — Organización Comunitaria | CaseWhy` : `${org.organizationName} — Community Organization | CaseWhy`,
    description: es
      ? `${org.organizationName}, una organización comunitaria que sirve a inmigrantes. Directorio gratuito, solo listado informativo.`
      : `${org.organizationName}, a community organization serving immigrants. Free directory, informational listing only.`,
    alternates: {
      languages: {
        en: `https://app.casewhy.com/community-orgs/${org.slug}`,
        es: `https://app.casewhy.com/community-orgs/${org.slug}?lang=es`,
      },
    },
  };
}

export default async function CommunityOrgDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const org = await getCommunityOrgBySlug(slug);
  if (!org) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/community-orgs" label={es ? "Todas las organizaciones comunitarias" : "All community organizations"} />
        <LanguageSwitcher es={es} basePath={`/community-orgs/${org.slug}`} variant="inline" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{org.organizationName}</h1>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        {org.cityStateZip && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Ubicación" : "Location"}</p>
            <p className="mt-1">{org.cityStateZip}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Beneficiario de subvención USCIS" : "USCIS grant recipient"}
          </p>
          <p className="mt-1">{org.fiscalYearsAwarded}</p>
        </div>
        {org.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Acerca de" : "About"}</p>
            <p className="mt-1">{org.description}</p>
          </div>
        )}
      </div>

      {org.websiteUrl && (
        <a
          href={org.websiteUrl}
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
          ? "Este es un listado informativo, no un aval ni un servicio de referencia. Siempre confirma los detalles actuales directamente con la organización antes de confiar en alguien."
          : "This is an informational listing, not an endorsement or a referral service. Always confirm current details directly with the organization before relying on anyone."}
      </p>

      <div className="mt-6">
        <VerificationLinks name={org.organizationName} context={org.cityStateZip ?? undefined} es={es} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareButton
          url={`https://app.casewhy.com/community-orgs/${org.slug}`}
          title={org.organizationName}
          text={
            es
              ? `Encontré esto en CaseWhy — ${org.organizationName}, un recurso gratuito de organización comunitaria/cultural — pensé que deberías verlo.`
              : `Found this on CaseWhy — ${org.organizationName}, a free community/cultural organization resource — thought you should see it.`
          }
          es={es}
        />
        <ReportListingLink
          entityType="community_org"
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
