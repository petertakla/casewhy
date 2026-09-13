import type { Metadata } from "next";
import Link from "next/link";
import { getCommunityOrgDirectory } from "@/lib/community-orgs/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra una Organización Comunitaria o Cultural | CaseWhy",
  description:
    "Directorio de organizaciones comunitarias y culturales que recibieron una subvención federal de USCIS para instrucción cívica y ayuda de naturalización.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/community-orgs",
      es: "https://app.casewhy.com/es/community-orgs",
    },
  },
};

const COMMUNITY_ORG_DIRECTORY_DISCLAIMER_ES =
  "Este directorio es solo para fines informativos. No constituye un servicio de referencia, y aparecer en la lista no implica un aval o recomendación por parte de esta plataforma. Siempre confirma los detalles actuales directamente con la organización antes de confiar en alguien.";

export const dynamic = "force-dynamic";

export default async function CommunityOrgsPageEs() {
  const directory = await getCommunityOrgDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/community-orgs" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra una organización comunitaria o cultural</h1>
      <p className="mb-2 mt-2 text-muted">
        Organizaciones comunitarias y culturales que han recibido una subvención federal de USCIS
        específicamente para instrucción cívica y ayuda de naturalización. Esto refleja
        organizaciones que ganaron esta subvención específica — no todas las organizaciones
        comunitarias que sirven a inmigrantes.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {COMMUNITY_ORG_DIRECTORY_DISCLAIMER_ES}
      </p>
      <p className="mb-8 text-xs text-muted">
        Gratis para explorar, siempre — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            Todavía estamos construyendo esta lista — vuelve pronto. Mientras tanto, USCIS publica
            sus propios{" "}
            <a
              href="https://www.uscis.gov/citizenship-resource-center/grant-program-impact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              registros de beneficiarios del Programa de Subvenciones de Ciudadanía e Integración
            </a>{" "}
            (en inglés).
          </p>
        </div>
      ) : (
        <StateFilter
          filterByStateLabel="Filtrar por estado"
          allStatesLabel="Todos los estados"
          noneYetLabel="(ninguno aún)"
          searchPlaceholder="Buscar por nombre, organización, o ciudad"
          emptyMessage="Ninguna organización coincide."
          items={directory.map((org) => ({
            key: org.id,
            states: [org.state],
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/community-orgs/${org.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{org.organizationName}</p>
                    <p className="text-xs text-muted">{org.state}</p>
                  </div>
                  {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
                  <p className="mt-1 text-xs text-muted">Beneficiario de subvención USCIS — {org.fiscalYearsAwarded}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="community_org"
                    entityId={org.id}
                    entityName={org.organizationName}
                    labels={{
                      trigger: "¿Ves algo incorrecto en este listado? Repórtalo",
                      success: "Gracias — lo revisaremos.",
                      whatsWrong: "¿Qué está mal en este listado?",
                      whatsWrongPlaceholder: "ej. el teléfono está desconectado, ya no está en esta dirección, la organización cerró",
                      email: "Tu correo (opcional, si quieres una respuesta)",
                      sending: "Enviando…",
                      send: "Enviar reporte",
                      cancel: "Cancelar",
                      defaultError: "Algo salió mal. Por favor intenta de nuevo.",
                    }}
                  />
                </div>
              </div>
            ),
          }))}
        />
      )}

      <p className="mt-8 text-sm text-muted">
        ¿Diriges una organización comunitaria o cultural que sirve a inmigrantes?{" "}
        <Link href="/community-orgs/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Solicita ser listado
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
