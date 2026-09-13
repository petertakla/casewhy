import type { Metadata } from "next";
import Link from "next/link";
import { getAttorneyDirectory } from "@/lib/attorneys/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra un Abogado de Inmigración | CaseWhy",
  description:
    "Directorio gratuito de abogados de inmigración — especialistas certificados obtenidos de registros oficiales de colegios de abogados estatales.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/attorneys",
      es: "https://app.casewhy.com/es/attorneys",
    },
  },
};

const ATTORNEY_DIRECTORY_DISCLAIMER_ES =
  "Este directorio es solo para fines informativos. No constituye un servicio de referencia de abogados, y aparecer en la lista no implica un aval o recomendación por parte de esta plataforma. Siempre confirma tú mismo la vigencia actual de la licencia de un abogado antes de contratar a alguien.";

export const dynamic = "force-dynamic";

export default async function AttorneysPageEs() {
  const directory = await getAttorneyDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/attorneys" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra un abogado</h1>
      <p className="mb-2 mt-2 text-muted">
        Abogados de inmigración — especialistas certificados obtenidos de registros oficiales de
        colegios de abogados estatales, más listados de auto-inscripción — para cualquier cosa que
        CaseWhy te indique que necesita el criterio de un profesional con licencia.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {ATTORNEY_DIRECTORY_DISCLAIMER_ES}
      </p>
      <p className="mb-8 text-xs text-muted">
        Gratis para explorar, siempre — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            Todavía estamos construyendo esta lista — vuelve pronto. Mientras tanto, la American
            Immigration Lawyers Association mantiene un{" "}
            <a
              href="https://www.ailalawyer.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              directorio buscable de sus propios miembros
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
          emptyMessage="Ningún abogado coincide."
          items={directory.map((attorney) => ({
            key: attorney.id,
            states: attorney.statesLicensed,
            searchText: `${attorney.name} ${attorney.firm ?? ""} ${attorney.practiceFocus.join(" ")} ${attorney.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/attorneys/${attorney.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{attorney.name}</p>
                    <p className="text-xs text-muted">{attorney.statesLicensed.join(", ")}</p>
                  </div>
                  {attorney.firm && <p className="text-sm text-muted">{attorney.firm}</p>}
                  <p className="mt-2 text-xs text-muted">{attorney.practiceFocus.join(" · ")}</p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="attorney"
                    entityId={attorney.id}
                    entityName={attorney.name}
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
        ¿Eres un abogado de inmigración con licencia?{" "}
        <Link href="/attorneys/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Solicita ser listado
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
