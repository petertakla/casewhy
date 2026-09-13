import type { Metadata } from "next";
import Link from "next/link";
import { getProBonoRepresentationDirectory } from "@/lib/pro-bono-representation/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra Representación Gratuita en la Corte de Inmigración | CaseWhy",
  description:
    "Directorio de organizaciones que ofrecen representación gratuita en procesos ante la corte de inmigración (defensa contra deportación), organizado por corte.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/pro-bono-representation",
      es: "https://app.casewhy.com/es/pro-bono-representation",
    },
  },
};

const PRO_BONO_REPRESENTATION_DISCLAIMER_ES =
  "EOIR no avala a ninguna de estas organizaciones, servicios de referencia, o abogados. La publicación de esta lista no constituye un aval por parte de EOIR, y su omisión no constituye una desaprobación. EOIR no participa en, ni es responsable de, las decisiones de representación o el desempeño de los abogados en esta lista.";

export const dynamic = "force-dynamic";

export default async function ProBonoRepresentationPageEs() {
  const directory = await getProBonoRepresentationDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/pro-bono-representation" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra representación gratuita en la corte de inmigración</h1>
      <p className="mb-2 mt-2 text-muted">
        Organizaciones que ofrecen representación gratuita en procesos ante la corte de
        inmigración (defensa contra deportación), organizadas por la corte de inmigración a la que
        sirven — una necesidad más específica y a menudo de mayor riesgo que la asistencia legal
        general.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {PRO_BONO_REPRESENTATION_DISCLAIMER_ES}
      </p>
      <p className="mb-8 text-xs text-muted">
        Gratis para explorar, siempre — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            Todavía estamos construyendo esta lista — vuelve pronto. Mientras tanto, EOIR publica
            su propia{" "}
            <a
              href="https://www.justice.gov/eoir/list-pro-bono-legal-service-providers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              Lista de Proveedores de Servicios Legales Pro Bono
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
            searchText: `${org.organizationName} ${org.cityStateZip ?? ""} ${org.immigrationCourt}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/pro-bono-representation/${org.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {org.organizationName}
                      {org.isReferralService && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">
                          Servicio de referencia
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{org.state}</p>
                  </div>
                  {org.cityStateZip && <p className="text-sm text-muted">{org.cityStateZip}</p>}
                  <p className="mt-1 text-xs text-muted">{org.immigrationCourt}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="pro_bono_representation"
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
        ¿Ofreces representación pro bono en la corte de inmigración?{" "}
        <Link href="/pro-bono-representation/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Solicita ser listado
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
