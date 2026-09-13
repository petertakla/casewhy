import type { Metadata } from "next";
import Link from "next/link";
import { getAccreditedRepresentativeDirectory } from "@/lib/accredited-representatives/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra un Representante Acreditado por el DOJ | CaseWhy",
  description:
    "Directorio gratuito y nacional de representantes acreditados por el DOJ — no abogados autorizados a practicar leyes de inmigración, obtenido del propio registro público del DOJ.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/accredited-representatives",
      es: "https://app.casewhy.com/es/accredited-representatives",
    },
  },
};

const ACCREDITED_REPRESENTATIVE_DIRECTORY_DISCLAIMER_ES =
  "Este directorio es solo para fines informativos. No constituye un servicio de referencia, y aparecer en la lista no implica un aval o recomendación por parte de esta plataforma. Siempre confirma tú mismo la acreditación vigente ante el DOJ de un representante antes de confiar en alguien.";

export const dynamic = "force-dynamic";

export default async function AccreditedRepresentativesPageEs() {
  const directory = await getAccreditedRepresentativeDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/accredited-representatives" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra un representante acreditado</h1>
      <p className="mb-2 mt-2 text-muted">
        Representantes acreditados por el DOJ — no abogados autorizados a practicar leyes de
        inmigración, típicamente en organizaciones sin fines de lucro. Obtenido del propio
        registro público del DOJ, a nivel nacional.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {ACCREDITED_REPRESENTATIVE_DIRECTORY_DISCLAIMER_ES}
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
          emptyMessage="Ningún representante acreditado coincide."
          items={directory.map((rep) => ({
            key: rep.id,
            states: [rep.state],
            searchText: `${rep.representativeName} ${rep.organizationName} ${rep.cityStateZip ?? ""} ${rep.streetAddress ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/accredited-representatives/${rep.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{rep.representativeName}</p>
                    <p className="text-xs text-muted">{rep.state}</p>
                  </div>
                  <p className="text-sm text-muted">{rep.organizationName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {rep.dhsOnly ? "Solo DHS" : "Acreditación completa"}
                    {rep.accreditationPendingRenewal ? " · renovación pendiente" : ""}
                  </p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="accredited_representative"
                    entityId={rep.id}
                    entityName={rep.representativeName}
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
        ¿Representas a una organización sin fines de lucro con personal acreditado por el DOJ?{" "}
        <Link href="/accredited-representatives/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Solicita ser listado
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
