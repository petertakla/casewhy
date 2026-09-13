import type { Metadata } from "next";
import Link from "next/link";
import { getLegalAidDirectory } from "@/lib/legal-aid/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra Asistencia Legal de Inmigración Gratuita o de Bajo Costo | CaseWhy",
  description:
    "Directorio gratuito y nacional de organizaciones de asistencia legal sin fines de lucro que ofrecen ayuda de inmigración de bajo o ningún costo.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/legal-aid",
      es: "https://app.casewhy.com/es/legal-aid",
    },
  },
};

const LEGAL_AID_DIRECTORY_DISCLAIMER_ES =
  "Este directorio es solo para fines informativos. No constituye un servicio de referencia, y aparecer en la lista no implica un aval o recomendación por parte de esta plataforma. Siempre confirma los detalles actuales (servicios, área de servicio, información de contacto) directamente con la organización antes de confiar en alguien.";

export const dynamic = "force-dynamic";

export default async function LegalAidPageEs() {
  const directory = await getLegalAidDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/legal-aid" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra una organización de asistencia legal</h1>
      <p className="mb-2 mt-2 text-muted">
        Organizaciones sin fines de lucro reconocidas por el DOJ para brindar ayuda legal de
        inmigración, a menudo con bajo o ningún costo. Obtenido del propio registro público del
        DOJ, a nivel nacional.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {LEGAL_AID_DIRECTORY_DISCLAIMER_ES}
      </p>
      <p className="mb-8 text-xs text-muted">
        Gratis para explorar, siempre — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            Todavía estamos construyendo esta lista — vuelve pronto. Mientras tanto, el
            Departamento de Justicia publica su propio{" "}
            <a
              href="https://www.justice.gov/eoir/recognition-accreditation-roster-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              registro de Organizaciones Reconocidas y Representantes Acreditados
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
          emptyMessage="Ninguna organización de asistencia legal coincide."
          items={directory.map((org) => ({
            key: org.id,
            states: [org.state],
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""} ${org.streetAddress ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/legal-aid/${org.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{org.organizationName}</p>
                    <p className="text-xs text-muted">{org.state}</p>
                  </div>
                  {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="legal_aid"
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
        ¿Diriges una organización sin fines de lucro que brinda ayuda legal de inmigración?{" "}
        <Link href="/legal-aid/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Solicita ser listado
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
