import type { Metadata } from "next";
import {
  FAMILY_FINAL_ACTION,
  EMPLOYMENT_FINAL_ACTION,
  VISA_BULLETIN_MONTH,
  VISA_BULLETIN_SOURCE_URL,
  VISA_BULLETIN_PREVIOUS_MONTH,
  bulletinDateLabel,
  computeMovement,
  type BulletinRow,
  type BulletinMovement,
} from "@/lib/kb/visa-bulletin";
import Link from "next/link";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { ShareButton } from "@/components/ShareButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Round 83 — was a static `export const metadata`; converted to
// generateMetadata() so a Spanish visitor gets a Spanish title/description
// and a self-referencing hreflang pair, same reasoning as
// processing-times/page.tsx's identical fix.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  return es
    ? {
        title: "Boletín de Visas — Fechas de Acción Final | CaseWhy",
        description:
          "Rastrea las Fechas de Acción Final del boletín de visas familiares y de empleo cada mes, con indicadores de movimiento desde el boletín anterior.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/visa-bulletin",
            es: "https://app.casewhy.com/visa-bulletin?lang=es",
          },
        },
      }
    : {
        title: "Visa Bulletin — Final Action Dates | CaseWhy",
        description:
          "Track family- and employment-based visa bulletin Final Action Dates each month, with movement indicators since the prior bulletin.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/visa-bulletin",
            es: "https://app.casewhy.com/visa-bulletin?lang=es",
          },
        },
      };
}

// Round 80 follow-up — same static→dynamic tradeoff as processing-times/page.tsx.
export const dynamic = "force-dynamic";

function MovementBadge({ movement, es }: { movement: BulletinMovement | null; es: boolean }) {
  if (!movement) return null;
  if (movement === "forward") {
    return (
      <span
        className="ml-1.5 inline-block rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
        title={es ? "Avanzó desde el mes pasado" : "Moved forward since last month"}
      >
        ▲
      </span>
    );
  }
  if (movement === "retrogressed") {
    return (
      <span
        className="ml-1.5 inline-block rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400"
        title={es ? "Retrocedió desde el mes pasado" : "Retrogressed since last month"}
      >
        ▼
      </span>
    );
  }
  return (
    <span
      className="ml-1.5 inline-block rounded-full bg-border px-1.5 py-0.5 text-[10px] font-semibold text-muted"
      title={es ? "Sin cambio desde el mes pasado" : "No change since last month"}
    >
      —
    </span>
  );
}

function BulletinTable({ rows, previousRows, es }: { rows: BulletinRow[]; previousRows?: BulletinRow[]; es: boolean }) {
  const previousFor = (category: string) => previousRows?.find((r) => r.category === category);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-semibold">{es ? "Categoría" : "Category"}</th>
            <th className="px-4 py-3 font-semibold">{es ? "Todos los demás países" : "All other countries"}</th>
            <th className="px-4 py-3 font-semibold">{es ? "China" : "China"}</th>
            <th className="px-4 py-3 font-semibold">{es ? "India" : "India"}</th>
            <th className="px-4 py-3 font-semibold">{es ? "México" : "Mexico"}</th>
            <th className="px-4 py-3 font-semibold">{es ? "Filipinas" : "Philippines"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const prev = previousFor(row.category);
            return (
              <tr key={row.category} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold">{row.category}</span>
                  <span className="ml-2 text-muted">{row.label}</span>
                </td>
                <td className="px-4 py-3 font-mono">
                  {bulletinDateLabel(row.allOther, es)}
                  <MovementBadge movement={computeMovement(row.allOther, prev?.allOther)} es={es} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.china ? bulletinDateLabel(row.china, es) : "—"}
                  <MovementBadge movement={computeMovement(row.china, prev?.china)} es={es} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.india ? bulletinDateLabel(row.india, es) : "—"}
                  <MovementBadge movement={computeMovement(row.india, prev?.india)} es={es} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.mexico ? bulletinDateLabel(row.mexico, es) : "—"}
                  <MovementBadge movement={computeMovement(row.mexico, prev?.mexico)} es={es} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.philippines ? bulletinDateLabel(row.philippines, es) : "—"}
                  <MovementBadge movement={computeMovement(row.philippines, prev?.philippines)} es={es} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Round 73 — direct-answer block + FAQPage schema, so the page's own
// existing "what does current mean" explanation (previously only at the
// very bottom) is extractable near the top too. See
// round73-seo-geo-foundation-task.md item 3-4.
const CURRENT_MEANS_ANSWER =
  "\"Current\" means visas are available to all qualified applicants in that category regardless of priority date. A listed date means only applicants with a priority date earlier than that date currently have a visa available.";

const CURRENT_MEANS_ANSWER_ES =
  "\"Vigente\" significa que las visas están disponibles para todos los solicitantes calificados en esa categoría sin importar la fecha de prioridad. Una fecha indicada significa que solo los solicitantes con una fecha de prioridad anterior a esa fecha tienen actualmente una visa disponible.";

function summarizeMovement(rows: BulletinRow[], previousRows?: BulletinRow[]): string {
  if (!previousRows) return "";
  let forward = 0;
  let retrogressed = 0;
  for (const row of rows) {
    const prev = previousRows.find((r) => r.category === row.category);
    if (!prev) continue;
    (["allOther", "china", "india", "mexico", "philippines"] as const).forEach((col) => {
      const movement = computeMovement(row[col], prev[col]);
      if (movement === "forward") forward++;
      if (movement === "retrogressed") retrogressed++;
    });
  }
  if (forward === 0 && retrogressed === 0) return "No categories moved since last month's bulletin.";
  const parts: string[] = [];
  if (forward > 0) parts.push(`${forward} moved forward`);
  if (retrogressed > 0) parts.push(`${retrogressed} retrogressed`);
  return `${parts.join(", ")} since last month's bulletin.`;
}

function summarizeMovementEs(rows: BulletinRow[], previousRows?: BulletinRow[]): string {
  if (!previousRows) return "";
  let forward = 0;
  let retrogressed = 0;
  for (const row of rows) {
    const prev = previousRows.find((r) => r.category === row.category);
    if (!prev) continue;
    (["allOther", "china", "india", "mexico", "philippines"] as const).forEach((col) => {
      const movement = computeMovement(row[col], prev[col]);
      if (movement === "forward") forward++;
      if (movement === "retrogressed") retrogressed++;
    });
  }
  if (forward === 0 && retrogressed === 0) return "Ninguna categoría avanzó desde el boletín del mes pasado.";
  const parts: string[] = [];
  if (forward > 0) parts.push(`${forward} avanzaron`);
  if (retrogressed > 0) parts.push(`${retrogressed} retrocedieron`);
  return `${parts.join(", ")} desde el boletín del mes pasado.`;
}

export default async function VisaBulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const movementSummary = VISA_BULLETIN_PREVIOUS_MONTH
    ? summarizeMovement(
        [...FAMILY_FINAL_ACTION, ...EMPLOYMENT_FINAL_ACTION],
        [...(VISA_BULLETIN_PREVIOUS_MONTH.family ?? []), ...(VISA_BULLETIN_PREVIOUS_MONTH.employment ?? [])]
      )
    : "";
  const movementSummaryEs = VISA_BULLETIN_PREVIOUS_MONTH ? summarizeMovementEs(
      [...FAMILY_FINAL_ACTION, ...EMPLOYMENT_FINAL_ACTION],
      [...(VISA_BULLETIN_PREVIOUS_MONTH.family ?? []), ...(VISA_BULLETIN_PREVIOUS_MONTH.employment ?? [])]
    ) : "";

  // Round 83 — this schema was hardcoded English regardless of `?lang=es`,
  // even though CURRENT_MEANS_ANSWER_ES (used in the visible body text
  // just below) already existed — the translation existed, it just wasn't
  // wired into the structured data.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: es ? "es" : "en",
    mainEntity: [
      {
        "@type": "Question",
        name: es ? "¿Qué significa 'Vigente' en el boletín de visas?" : "What does 'Current' mean on the visa bulletin?",
        acceptedAnswer: { "@type": "Answer", text: es ? CURRENT_MEANS_ANSWER_ES : CURRENT_MEANS_ANSWER },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LanguageSwitcher es={es} href={localeToggleHref("/visa-bulletin", {}, es)} />
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Boletín de visas" : "Visa bulletin"}</h1>
      <p className="mb-2 mt-2 text-muted">
        {es ? (
          <>
            Fechas de Acción Final — la tabla que determina cuándo una tarjeta verde basada en familia o
            empleo puede realmente emitirse, o un ajuste de estatus aprobarse, una vez que una petición
            ha sido aprobada y una fecha de prioridad está esperando a que una visa esté disponible.
          </>
        ) : (
          <>
            Final Action Dates — the chart that determines when a family- or employment-based green
            card can actually be issued or adjustment of status approved, once a petition is
            approved and a priority date is waiting for a visa to become available.
          </>
        )}
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {es ? CURRENT_MEANS_ANSWER_ES : CURRENT_MEANS_ANSWER} {es ? movementSummaryEs : movementSummary}
      </p>
      <p className="mb-8 text-xs text-muted">
        {VISA_BULLETIN_MONTH} —{" "}
        <a
          href={VISA_BULLETIN_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          {es ? "ver el boletín oficial del Departamento de Estado" : "view the official Department of State bulletin"}
        </a>
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/visa-bulletin"
          title="CaseWhy — Visa bulletin"
          text={es ? "Rastrea el movimiento del boletín de visas gratis con CaseWhy." : "Track visa bulletin movement for free with CaseWhy."}
          es={es}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
        {es ? "Preferencias por patrocinio familiar" : "Family-sponsored preferences"}
      </h2>
      <BulletinTable rows={FAMILY_FINAL_ACTION} previousRows={VISA_BULLETIN_PREVIOUS_MONTH?.family} es={es} />

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-muted">
        {es ? "Preferencias basadas en empleo" : "Employment-based preferences"}
      </h2>
      <BulletinTable rows={EMPLOYMENT_FINAL_ACTION} previousRows={VISA_BULLETIN_PREVIOUS_MONTH?.employment} es={es} />

      <Link href={es ? "/processing-times?lang=es" : "/processing-times"} className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
        {es ? "Ver tiempos de procesamiento →" : "See processing times →"}
      </Link>

      {!VISA_BULLETIN_PREVIOUS_MONTH && (
        <p className="mt-4 text-xs text-muted">
          {es
            ? "Las insignias de movimiento mes a mes empezarán a aparecer una vez que se agregue el boletín del próximo mes junto a este."
            : "Month-over-month movement badges will start appearing once next month's bulletin is added alongside this one."}
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        {es ? (
          <>
            &quot;Vigente&quot; significa que las visas están disponibles para todos los solicitantes
            calificados en esa categoría sin importar la fecha de prioridad. Una fecha indicada significa
            que solo los solicitantes con una fecha de prioridad anterior a esa fecha tienen actualmente
            una visa disponible. Esta tabla se actualiza mensualmente — siempre confirma con el boletín
            oficial de arriba antes de basarte en ella para una decisión de presentación.
          </>
        ) : (
          <>
            &quot;Current&quot; means visas are available to all qualified applicants in that category
            regardless of priority date. A listed date means only applicants with a priority date
            earlier than that date currently have a visa available. This table is refreshed monthly —
            always confirm against the official bulletin above before relying on it for a filing
            decision.
          </>
        )}
      </p>
    </main>
  );
}
