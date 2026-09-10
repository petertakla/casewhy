"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getEntityType, type EntityTypeId } from "@/lib/get-help/entity-types";
import { routeVisitorQuery, type RouteResult } from "./actions";

type OutcomeId = EntityTypeId | "ask_ai" | "not_sure";

type Step = "q1" | "q2" | "q3" | "result";

interface Choice {
  label: string;
  next: Step | { outcomes: OutcomeId[] };
}

const Q1_CHOICES: Choice[] = [
  { label: "I don't understand something about my case, a status, or a term I saw", next: { outcomes: ["ask_ai"] } },
  {
    label: "I'm in immigration court / removal (deportation) proceedings",
    next: { outcomes: ["attorneys", "pro_bono_representation"] },
  },
  { label: "I have a pending case/application and want legal advice", next: "q2" },
  { label: "I need general or community support, not necessarily legal", next: "q3" },
  { label: "I'm an F-1/M-1 international student with a school question", next: { outcomes: ["dso"] } },
  { label: "I'm an employer", next: { outcomes: ["employers"] } },
];

const Q2_CHOICES: Choice[] = [
  { label: "Yes, I can pay for a private attorney", next: { outcomes: ["attorneys"] } },
  {
    label: "No, or I'm not sure",
    next: { outcomes: ["accredited_representatives", "legal_aid"] },
  },
];

const Q3_CHOICES: Choice[] = [
  { label: "Legal guidance on a low income", next: { outcomes: ["legal_aid"] } },
  {
    label: "General community support (translation, cultural navigation, referrals)",
    next: { outcomes: ["community_orgs"] },
  },
];

const QUESTIONS: Record<Exclude<Step, "result">, { prompt: string; choices: Choice[] }> = {
  q1: { prompt: "What's going on right now?", choices: Q1_CHOICES },
  q2: { prompt: "Can you pay for a private attorney?", choices: Q2_CHOICES },
  q3: {
    prompt: "Legal guidance on a low income, or general community support?",
    choices: Q3_CHOICES,
  },
};

function OutcomeCard({ id }: { id: OutcomeId }) {
  if (id === "ask_ai") {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-5">
        <p className="font-semibold text-foreground">Ask CaseWhy</p>
        <p className="mt-1 text-sm text-muted">
          Ask a free general question right now — no sign-in required. Grounded in CaseWhy&apos;s
          own USCIS policy knowledge base, not your specific case.
        </p>
        <Link
          href="/get-help/ask"
          className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Ask a question →
        </Link>
      </div>
    );
  }

  if (id === "not_sure") {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-5">
        <p className="text-sm text-muted">
          Not sure which one fits — take a look at the full list below.
        </p>
      </div>
    );
  }

  const entity = getEntityType(id);
  if (!entity) return null;

  if (entity.status === "coming-soon" || !entity.href) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-muted">{entity.label}</p>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            Coming soon
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
          Start over
        </button>
        <a href="#full-list" className="text-sm text-muted hover:text-foreground hover:underline">
          Not sure, or want to see everything?
        </a>
      </div>
    </div>
  );
}

export function GetHelpChooser() {
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
        setAiError("Something went wrong. Please try the questions above instead.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">Not sure which one you need?</h2>
      <p className="mt-1 text-sm text-muted">Answer a couple of questions, or describe your situation below.</p>

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
            Not sure, or want to see everything?
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
            placeholder="Or describe your situation in your own words…"
            className="flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isPending || !freeText.trim()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Thinking…" : "Find my resource"}
          </button>
        </form>
        {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}
      </div>
    </div>
  );
}
