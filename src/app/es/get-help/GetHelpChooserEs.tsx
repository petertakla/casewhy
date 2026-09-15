"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { EntityTypeId } from "@/lib/get-help/entity-types";
import { routeVisitorQuery, type RouteResult } from "@/app/get-help/actions";

// Round 79 — Spanish variant of GetHelpChooser.tsx, originally fixed-
// question flow only, deliberately omitting the English chooser's
// free-text "describe your situation" box (reasoning below is stale —
// see round 83).
//
// Round 83 — the free-text box added. The original reasoning ("Track 2,
// AI-classification call, out of scope") turned out to overstate the
// risk: routeVisitorQuery() never shows the model's raw output to
// anyone — it's parsed and validated against a fixed allow-list of
// outcome tokens, then rendered through the same already-translated
// OutcomeCard below the fixed Q1/Q2/Q3 tree uses. There's no AI-
// generated prose in Spanish (or English) for a visitor to ever see from
// this box, so it doesn't carry the same translation-quality risk a real
// chat response would. The "I don't understand something..." choice (and
// the "ask_ai" outcome this box can also route to) still points to
// /get-help/ask, the real AI Q&A page.
//
// Round 105 — /get-help/ask is now locale-aware (chrome + AI answer
// language), so the link below goes to its Spanish variant
// (?lang=es) instead of resetting the visitor to an English-only page,
// and the OutcomeCard's old "(this tool answers in English)" caveat is
// gone since it's no longer true.

type OutcomeId = EntityTypeId | "ask_ai" | "not_sure";
type Step = "q1" | "q2" | "q3" | "result";

interface Choice {
  label: string;
  next: Step | { outcomes: OutcomeId[] };
}

const Q1_CHOICES: Choice[] = [
  { label: "No entiendo algo sobre mi caso, un estado, o un término que vi", next: { outcomes: ["ask_ai"] } },
  {
    label: "Estoy en la corte de inmigración / procesos de deportación",
    next: { outcomes: ["attorneys", "pro_bono_representation"] },
  },
  { label: "Tengo un caso/solicitud pendiente y quiero asesoría legal", next: "q2" },
  { label: "Necesito apoyo general o comunitario, no necesariamente legal", next: "q3" },
  { label: "Soy estudiante internacional F-1/M-1 con una pregunta de mi escuela", next: { outcomes: ["dso"] } },
  { label: "Soy un empleador", next: { outcomes: ["employers"] } },
];

const Q2_CHOICES: Choice[] = [
  { label: "Sí, puedo pagar un abogado privado", next: { outcomes: ["attorneys"] } },
  {
    label: "No, o no estoy seguro",
    next: { outcomes: ["accredited_representatives", "legal_aid"] },
  },
];

const Q3_CHOICES: Choice[] = [
  { label: "Orientación legal con bajos ingresos", next: { outcomes: ["legal_aid"] } },
  {
    label: "Apoyo comunitario general (traducción, orientación cultural, referencias)",
    next: { outcomes: ["community_orgs"] },
  },
];

const QUESTIONS: Record<Exclude<Step, "result">, { prompt: string; choices: Choice[] }> = {
  q1: { prompt: "¿Qué está pasando ahora mismo?", choices: Q1_CHOICES },
  q2: { prompt: "¿Puedes pagar un abogado privado?", choices: Q2_CHOICES },
  q3: {
    prompt: "¿Orientación legal con bajos ingresos, o apoyo comunitario general?",
    choices: Q3_CHOICES,
  },
};

const ENTITY_ES: Record<EntityTypeId, { label: string; description: string; href: string | null; status: "live" | "coming-soon" }> = {
  attorneys: {
    label: "Abogados",
    description: "Abogados con licencia de inmigración que pueden representarte y darte asesoría específica para tu caso.",
    href: "/es/attorneys",
    status: "live",
  },
  accredited_representatives: {
    label: "Representantes acreditados",
    description: "Representantes acreditados por el DOJ, sin ser abogados, autorizados a practicar leyes de inmigración.",
    href: "/es/accredited-representatives",
    status: "live",
  },
  legal_aid: {
    label: "Asistencia legal y organizaciones sin fines de lucro",
    description: "Ayuda de inmigración para quienes no pueden pagar un abogado privado.",
    href: "/es/legal-aid",
    status: "live",
  },
  pro_bono_representation: {
    label: "Representación gratuita en la corte de inmigración",
    description: "Representación gratuita en procesos ante la corte de inmigración, organizada por corte.",
    href: "/es/pro-bono-representation",
    status: "live",
  },
  dso: {
    label: "Oficinas internacionales de universidades",
    description: "Encuentra la oficina de estudiantes internacionales de tu escuela.",
    href: "/es/dso",
    status: "live",
  },
  community_orgs: {
    label: "Organizaciones comunitarias y culturales",
    description: "Organizaciones locales y culturales que apoyan a los inmigrantes.",
    href: "/es/community-orgs",
    status: "live",
  },
  employers: {
    label: "Para empleadores",
    description: "Patrocinando o apoyando a empleados a través del proceso de inmigración.",
    href: null,
    status: "coming-soon",
  },
};

function OutcomeCard({ id }: { id: OutcomeId }) {
  if (id === "ask_ai") {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-5">
        <p className="font-semibold text-foreground">Pregúntale a CaseWhy</p>
        <p className="mt-1 text-sm text-muted">
          Haz una pregunta general gratis ahora mismo — no necesitas iniciar sesión. Basado en la
          propia base de conocimiento de políticas de USCIS de CaseWhy, no en tu caso específico.
        </p>
        <Link
          href="/get-help/ask?lang=es"
          className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Hacer una pregunta →
        </Link>
      </div>
    );
  }

  if (id === "not_sure") {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-5">
        <p className="text-sm text-muted">
          No estamos seguros de cuál te conviene — echa un vistazo a la lista completa abajo.
        </p>
      </div>
    );
  }

  const entity = ENTITY_ES[id];

  if (entity.status === "coming-soon" || !entity.href) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-muted">{entity.label}</p>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            Próximamente
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{entity.description}</p>
      </div>
    );
  }

  return (
    <Link
      href={entity.href}
      className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <p className="font-semibold text-foreground">{entity.label}</p>
      <p className="mt-1 text-sm text-muted">{entity.description}</p>
    </Link>
  );
}

function ResultView({ outcomeIds, onReset }: { outcomeIds: OutcomeId[]; onReset: () => void }) {
  return (
    <div className="space-y-3">
      {outcomeIds.map((id) => (
        <OutcomeCard key={id} id={id} />
      ))}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" onClick={onReset} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          Empezar de nuevo
        </button>
        <a href="#full-list" className="text-sm text-muted hover:text-foreground hover:underline">
          ¿No estás seguro, o quieres ver todo?
        </a>
      </div>
    </div>
  );
}

export function GetHelpChooserEs() {
  const [step, setStep] = useState<Step>("q1");
  const [outcomeIds, setOutcomeIds] = useState<OutcomeId[] | null>(null);
  const [freeText, setFreeText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  function choose(choice: Choice) {
    if (typeof choice.next === "string") {
      setStep(choice.next);
    } else {
      setOutcomeIds(choice.next.outcomes);
      setStep("result");
    }
  }

  function reset() {
    setStep("q1");
    setOutcomeIds(null);
    setFreeText("");
    setAiError(null);
  }

  function submitFreeText(e: React.FormEvent) {
    e.preventDefault();
    if (!freeText.trim()) return;
    setAiError(null);
    startTransition(async () => {
      try {
        const result: RouteResult = await routeVisitorQuery(freeText);
        setOutcomeIds(result.outcomeIds);
        setStep("result");
      } catch {
        setAiError("Algo salió mal. Por favor intenta las preguntas de arriba en su lugar.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">¿No estás seguro de cuál necesitas?</h2>
      <p className="mt-1 text-sm text-muted">Responde un par de preguntas, o describe tu situación abajo.</p>

      {step !== "result" && (
        <div className="mt-4">
          <p className="font-medium text-foreground">{QUESTIONS[step].prompt}</p>
          <div className="mt-3 flex flex-col gap-2">
            {QUESTIONS[step].choices.map((choice) => (
              <button
                key={choice.label}
                type="button"
                onClick={() => choose(choice)}
                className="rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-brand-500 hover:bg-surface-2"
              >
                {choice.label}
              </button>
            ))}
          </div>
          <a href="#full-list" className="mt-3 inline-block text-xs text-muted hover:text-foreground hover:underline">
            ¿No estás seguro, o quieres ver todo?
          </a>
        </div>
      )}

      {step === "result" && outcomeIds && <ResultView outcomeIds={outcomeIds} onReset={reset} />}

      <div className="mt-6 border-t border-border pt-4">
        <form onSubmit={submitFreeText} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="O describe tu situación con tus propias palabras…"
            className="flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isPending || !freeText.trim()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Pensando…" : "Encontrar mi recurso"}
          </button>
        </form>
        {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}
      </div>
    </div>
  );
}
