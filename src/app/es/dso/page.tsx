import type { Metadata } from "next";
import Link from "next/link";
import { getDsoDirectory } from "@/lib/dso/directory";
import { StateFilter } from "@/components/StateFilter";
import { ReportListingLink } from "@/components/ReportListingLink";

export const metadata: Metadata = {
  title: "Encuentra la Oficina Internacional de tu Universidad (DSO) | CaseWhy",
  description:
    "Directorio de escuelas certificadas por SEVP para estudiantes internacionales F-1/M-1, obtenido del directorio oficial de escuelas del DHS.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/dso",
      es: "https://app.casewhy.com/es/dso",
    },
  },
};

const DSO_DIRECTORY_DISCLAIMER_ES =
  "Este directorio es solo para fines informativos. No constituye un servicio de referencia, y aparecer en la lista no implica un aval o recomendación por parte de esta plataforma. Siempre confirma los detalles actuales directamente con la escuela antes de confiar en alguien.";

export const dynamic = "force-dynamic";

export default async function DsoPageEs() {
  const directory = await getDsoDirectory();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/dso" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Encuentra la oficina internacional de tu escuela</h1>
      <p className="mb-2 mt-2 text-muted">
        Escuelas certificadas por SEVP autorizadas para inscribir estudiantes internacionales
        F-1/M-1, obtenido del propio directorio oficial de escuelas del DHS. El DHS no publica el
        nombre ni la información de contacto de un Funcionario Escolar Designado (DSO) para
        ninguna escuela — esto te dirige a cada escuela para que puedas contactar directamente a
        su oficina de estudiantes internacionales.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {DSO_DIRECTORY_DISCLAIMER_ES}
      </p>
      <p className="mb-8 text-xs text-muted">
        Gratis para explorar, siempre — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.
      </p>

      {directory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            Todavía estamos construyendo esta lista — vuelve pronto. Mientras tanto, el DHS publica
            su propia{" "}
            <a
              href="https://studyinthestates.dhs.gov/school-search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline"
            >
              herramienta de Búsqueda de Escuelas
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
          emptyMessage="Ninguna escuela coincide."
          items={directory.map((school) => ({
            key: school.id,
            states: [school.state],
            searchText: `${school.schoolName} ${school.campusName ?? ""} ${school.cityStateZip ?? ""}`,
            node: (
              <div className="rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
                <Link href={`/dso/${school.slug}`} className="block p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{school.schoolName}</p>
                    <p className="text-xs text-muted">{school.state}</p>
                  </div>
                  {school.campusName && school.campusName !== school.schoolName && (
                    <p className="text-sm text-muted">{school.campusName}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {[school.f1Certified && "F-1", school.m1Certified && "M-1"]
                      .filter(Boolean)
                      .join(" · ")}
                    {school.isMainCampus ? " · Campus principal" : ""}
                  </p>
                </Link>
                <div className="border-t border-border px-5 py-2">
                  <ReportListingLink
                    entityType="dso"
                    entityId={school.id}
                    entityName={school.schoolName}
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
        ¿Eres un Funcionario Escolar Designado?{" "}
        <Link href="/dso/join" className="text-brand-600 hover:underline dark:text-brand-400">
          Agrega tu información de contacto
        </Link>{" "}
        — gratis, sin costo de inscripción. (Formulario en inglés.)
      </p>
    </main>
  );
}
