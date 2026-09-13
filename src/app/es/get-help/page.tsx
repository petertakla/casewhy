import type { Metadata } from "next";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { GetHelpChooserEs } from "./GetHelpChooserEs";

export const metadata: Metadata = {
  title: "Obtener Ayuda — Encuentra un Abogado de Inmigración o Asistencia Legal Gratuita | CaseWhy",
  description:
    "Directorio gratuito de abogados de inmigración, representantes acreditados, organizaciones de asistencia legal y más — sin cuotas, sin anuncios, sin necesidad de iniciar sesión.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/get-help",
      es: "https://app.casewhy.com/es/get-help",
    },
  },
};

interface EntityCardEs {
  id: string;
  label: string;
  description: string;
  whenToUse: string | null;
  href: string | null;
  status: "live" | "coming-soon";
}

const ENTITY_TYPES_ES: EntityCardEs[] = [
  {
    id: "attorneys",
    href: "/es/attorneys",
    label: "Abogados",
    description: "Abogados con licencia de inmigración que pueden representarte y darte asesoría específica para tu caso.",
    whenToUse:
      "Quieres un profesional con licencia que pueda representarte formalmente, firmar documentos en tu nombre, o comparecer en la corte de inmigración por ti.",
    status: "live",
  },
  {
    id: "accredited_representatives",
    href: "/es/accredited-representatives",
    label: "Representantes acreditados",
    description:
      "Representantes acreditados por el DOJ, sin ser abogados — a menudo en organizaciones sin fines de lucro — autorizados a practicar leyes de inmigración.",
    whenToUse:
      "Quieres ayuda legal profesional pero los honorarios de un abogado privado están fuera de tu alcance, o prefieres trabajar con una organización sin fines de lucro.",
    status: "live",
  },
  {
    id: "legal_aid",
    href: "/es/legal-aid",
    label: "Asistencia legal y organizaciones sin fines de lucro",
    description: "Ayuda de inmigración para quienes no pueden pagar un abogado privado.",
    whenToUse: "Necesitas orientación general o una consulta y tienes ingresos limitados.",
    status: "live",
  },
  {
    id: "pro_bono_representation",
    href: "/es/pro-bono-representation",
    label: "Representación gratuita en la corte de inmigración",
    description: "Representación gratuita en procesos ante la corte de inmigración, organizada por corte.",
    whenToUse: "Estás en la corte de inmigración / procesos de deportación ahora mismo y necesitas representación ahí, sin costo.",
    status: "live",
  },
  {
    id: "dso",
    href: "/es/dso",
    label: "Oficinas internacionales de universidades",
    description: "Encuentra la oficina de estudiantes internacionales de tu escuela, para preguntas de estatus F-1/M-1.",
    whenToUse: "Eres un estudiante internacional F-1/M-1 con una pregunta de estatus o SEVIS relacionada con tu escuela.",
    status: "live",
  },
  {
    id: "community_orgs",
    href: "/es/community-orgs",
    label: "Organizaciones comunitarias y culturales",
    description: "Organizaciones locales y culturales que apoyan a los inmigrantes.",
    whenToUse: "Quieres apoyo local, con coincidencia cultural o lingüística — no necesariamente ayuda legal.",
    status: "live",
  },
  {
    id: "employers",
    href: null,
    label: "Para empleadores",
    description: "Patrocinando o apoyando a empleados a través del proceso de inmigración.",
    whenToUse: null,
    status: "coming-soon",
  },
];

export default function GetHelpPageEs() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-2 text-right text-sm">
        <Link href="/get-help" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Obtener ayuda</h1>
      <p className="mt-2 text-muted">
        CaseWhy te da información en lenguaje sencillo, no asesoría legal. Cuando tu situación
        necesita el criterio de un profesional con licencia, aquí es donde encontrar uno.
      </p>
      <p className="mt-2 text-xs text-muted">
        Esta página es una lista informativa, no un aval ni un servicio de referencia. CaseWhy no
        garantiza resultados, y aparecer aquí no significa que ese listado sea adecuado para tu
        situación específica.
      </p>
      <p className="mt-2 text-xs text-muted">
        Cada recurso aquí es gratuito para usar, siempre — sin cuotas, sin anuncios, sin costo
        oculto. Igual que el resto de CaseWhy: tampoco vendemos tus datos ni mostramos anuncios.
      </p>

      <div className="mt-4">
        <ShareButton
          url="https://app.casewhy.com/es/get-help"
          title="CaseWhy — Obtener Ayuda"
          text="Asistencia legal gratuita, representantes acreditados, abogados y más — todo en un solo lugar. Sin cuotas. Sin anuncios."
        />
      </div>

      <div className="mt-8">
        <GetHelpChooserEs />
      </div>

      <div id="full-list" className="mt-8 scroll-mt-20 space-y-4">
        {ENTITY_TYPES_ES.map((category) =>
          category.status === "live" && category.href ? (
            <Link
              key={category.id}
              href={category.href}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="font-semibold text-foreground">{category.label}</p>
              <p className="mt-1 text-sm text-muted">{category.description}</p>
              {category.whenToUse && (
                <p className="mt-2 text-sm text-brand-600 dark:text-brand-400">
                  Usa esto cuando: {category.whenToUse}
                </p>
              )}
            </Link>
          ) : (
            <div key={category.id} className="rounded-xl border border-dashed border-border-strong p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-muted">{category.label}</p>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                  Próximamente
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{category.description}</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
