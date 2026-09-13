"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  saveMyMailingAddress,
  getMySavedAddress,
  getMyRepresentatives,
  draftMyEscalationLetter,
  type RepresentativesResult,
} from "../escalation/actions";

type LetterType = "congressional" | "field_office" | "ombudsman";

const LETTER_LABELS: Record<LetterType, string> = {
  congressional: "Draft a congressional inquiry letter",
  field_office: "Draft a field-office follow-up letter",
  ombudsman: "Draft a USCIS Ombudsman request",
};

const LETTER_LABELS_ES: Record<LetterType, string> = {
  congressional: "Redactar una carta de consulta al Congreso",
  field_office: "Redactar una carta de seguimiento a la oficina local",
  ombudsman: "Redactar una solicitud al Ombudsman de USCIS",
};

/**
 * CW-39, Part B — CaseWhy Plus only. Save a mailing address once, look up
 * a representative from it, then draft one of three escalation letters
 * for this tracked case. See src/lib/congress/representatives.ts for the
 * (deliberately partial — Florida pilot only) coverage this pass shipped.
 */
export function EscalationToolkit({
  trackedCaseId,
  canUseToolkit,
  es,
}: {
  trackedCaseId: string;
  canUseToolkit: boolean;
  es: boolean;
}) {
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);
  const [form, setForm] = useState({ fullName: "", street: "", city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [reps, setReps] = useState<RepresentativesResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [activeLetterType, setActiveLetterType] = useState<LetterType | null>(null);
  const [reason, setReason] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [letterText, setLetterText] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseToolkit) return;
    getMySavedAddress().then((addr) => {
      setHasAddress(!!addr);
      if (addr) setForm(addr);
    });
  }, [canUseToolkit]);

  if (!canUseToolkit) {
    return (
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "Kit de herramientas de escalamiento" : "Escalation toolkit"}
        </p>
        <p className="text-sm text-muted">
          <Link href="/plus" className="text-brand-600 hover:underline dark:text-brand-400">
            {es ? "Actualiza a CaseWhy Plus" : "Upgrade to CaseWhy Plus"}
          </Link>{" "}
          {es ? "para encontrar a tu representante y redactar una carta de seguimiento." : "to find your representative and draft a follow-up letter."}
        </p>
      </div>
    );
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveMyMailingAddress(form);
      if (!result.ok) {
        setSaveError(result.error ?? (es ? "No se pudo guardar esa dirección." : "Couldn't save that address."));
        return;
      }
      setHasAddress(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleLookup() {
    setLookingUp(true);
    setLookupError(null);
    setReps(null);
    try {
      const result = await getMyRepresentatives();
      if (!result.ok) {
        setLookupError(result.error);
        return;
      }
      setReps(result.result);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleDraft(letterType: LetterType) {
    setDrafting(true);
    setDraftError(null);
    setLetterText(null);
    try {
      const result = await draftMyEscalationLetter({ trackedCaseId, letterType, userReason: reason });
      if (!result.ok) {
        setDraftError(result.error);
        return;
      }
      setLetterText(result.letterText);
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
        {es ? "Kit de herramientas de escalamiento" : "Escalation toolkit"}
      </p>
      <p className="mb-3 text-xs text-muted">
        {es ? (
          <>
            Si sientes que esto necesita más que una carta,{" "}
            <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              obtén ayuda de un profesional con licencia
            </Link>
            .
          </>
        ) : (
          <>
            If this feels like it needs more than a letter,{" "}
            <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              get help from a licensed professional
            </Link>
            .
          </>
        )}
      </p>

      {hasAddress === null && <p className="text-xs text-muted">{es ? "Cargando…" : "Loading…"}</p>}

      {hasAddress !== null && (
        <form onSubmit={handleSaveAddress} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            placeholder={es ? "Nombre completo" : "Full name"}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            className="col-span-2 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-4"
          />
          <input
            placeholder={es ? "Dirección" : "Street address"}
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
            className="col-span-2 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-4"
          />
          <input
            placeholder={es ? "Ciudad" : "City"}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            className="col-span-2 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            placeholder={es ? "Estado (ej. FL)" : "State (e.g. FL)"}
            value={form.state}
            maxLength={2}
            onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
            required
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            placeholder={es ? "Código postal" : "ZIP"}
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            required
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? (es ? "Guardando…" : "Saving…") : hasAddress ? (es ? "Actualizar dirección" : "Update address") : es ? "Guardar dirección" : "Save address"}
          </button>
        </form>
      )}
      {saveError && <p className="mt-1 text-xs text-red-500">{saveError}</p>}

      {hasAddress && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookingUp}
            className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60 dark:text-brand-400"
          >
            {lookingUp ? (es ? "Buscando…" : "Looking up…") : es ? "Encontrar a mis representantes" : "Find my representatives"}
          </button>
          {lookupError && <p className="mt-1 text-xs text-red-500">{lookupError}</p>}

          {reps && reps.representatives.length === 0 && (
            <p className="mt-2 text-xs text-muted">
              {es ? (
                <>
                  CaseWhy aún no cubre tu área (este piloto solo cubre a los senadores de la Florida y el
                  2do distrito). Usa las herramientas oficiales de búsqueda de la{" "}
                  <a
                    href="https://www.house.gov/representatives/find-your-representative"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Cámara
                  </a>{" "}
                  y del{" "}
                  <a
                    href="https://www.senate.gov/senators/senators-contact.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Senado
                  </a>{" "}
                  en su lugar.
                </>
              ) : (
                <>
                  CaseWhy doesn&apos;t have your area covered yet (this pilot only covers Florida&apos;s
                  senators and 2nd district). Use the official{" "}
                  <a
                    href="https://www.house.gov/representatives/find-your-representative"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    House
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.senate.gov/senators/senators-contact.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Senate
                  </a>{" "}
                  lookup tools instead.
                </>
              )}
            </p>
          )}

          {reps && reps.representatives.length > 0 && (
            <ul className="mt-2 space-y-2">
              {reps.representatives.map((r) => (
                <li key={`${r.chamber}-${r.name}`} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <p className="font-semibold">
                    {r.name} ({r.party}) —{" "}
                    {r.chamber === "senate"
                      ? es ? "Senador de EE.UU." : "U.S. Senator"
                      : es
                        ? `Representante de EE.UU., ${r.state}-${r.district}`
                        : `U.S. Representative, ${r.state}-${r.district}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.phone} ·{" "}
                    <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                      {es ? "Sitio web" : "Website"}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasAddress && (
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(LETTER_LABELS) as LetterType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveLetterType(type);
                setLetterText(null);
                setDraftError(null);
              }}
              className={`text-xs font-semibold hover:underline ${
                activeLetterType === type ? "text-brand-600 dark:text-brand-400" : "text-muted"
              }`}
            >
              {es ? LETTER_LABELS_ES[type] : LETTER_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {activeLetterType && (
        <div className="mt-3">
          {/* Round 80 — this textarea is the user's own free-text input
              (feeds draftMyEscalationLetter, an AI call) and letterText
              below is the AI-drafted letter itself — both Track 2, left
              untranslated. Only the placeholder prompt and surrounding
              button/label chrome are translated. */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              es
                ? "¿Qué te está costando realmente este retraso? (un par de oraciones)"
                : "What's this delay actually costing you? (a couple of sentences)"
            }
            rows={2}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => handleDraft(activeLetterType)}
            disabled={drafting || !reason.trim()}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {drafting ? (es ? "Redactando…" : "Drafting…") : es ? "Redactar carta" : "Draft letter"}
          </button>
          {draftError && <p className="mt-1 text-xs text-red-500">{draftError}</p>}
          {letterText && (
            <textarea
              readOnly
              value={letterText}
              rows={12}
              className="mt-3 w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 font-mono text-xs text-foreground/90 outline-none"
            />
          )}
        </div>
      )}
    </div>
  );
}
