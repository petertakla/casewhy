"use client";

// Round 110 — the site-wide search overlay. Opened by the header's search
// icon, Cmd/Ctrl-K anywhere, or the Resources menu's own search box (via
// the openSiteSearch() event bus, see open-search-event.ts). Merges two
// independent result sources in one dialog: MiniSearch over the build-
// time content index (instant, client-side) and the live directory
// endpoint (debounced, server-side) -- exactly the split the task doc
// asks for, since editorial content is small enough to ship to the
// browser and the six directory tables aren't.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";
import { searchContent, type IndexedDoc } from "@/lib/search/client";
import { SEARCH_OPEN_EVENT } from "@/lib/search/open-search-event";
import { PlusBadge } from "./PlusBadge";

interface DirectoryRow {
  name: string;
  city: string | null;
  state: string;
  url: string;
}
interface DirectoryGroup {
  entityType: string;
  typeLabel: string;
  typeLabelEs: string;
  count: number;
  rows: DirectoryRow[];
  seeAllUrl: string;
}

const EXAMPLE_QUERIES = ["case was received", "I-485 processing time", "attorney florida"];
const EXAMPLE_QUERIES_ES = ["caso recibido", "tiempo de procesamiento I-485", "abogado florida"];

const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function SiteSearch() {
  const isSpanish = useIsSpanish();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [content, setContent] = useState<{ answers: IndexedDoc[]; reference: IndexedDoc[]; pages: IndexedDoc[] }>({
    answers: [],
    reference: [],
    pages: [],
  });
  const [directoryGroups, setDirectoryGroups] = useState<DirectoryGroup[]>([]);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [outcomeLogged, setOutcomeLogged] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const locale = isSpanish ? "es" : "en";

  const logEvent = useCallback(
    (outcome: "clicked_result" | "asked_casewhy" | "abandoned") => {
      if (!query.trim()) return;
      const resultCounts = {
        answers: content.answers.length,
        reference: content.reference.length,
        getHelp: directoryGroups.reduce((sum, g) => sum + g.rows.length, 0),
        pages: content.pages.length,
      };
      fetch("/api/search/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), locale, resultCounts, outcome }),
      }).catch(() => {});
    },
    [query, locale, content, directoryGroups]
  );

  const closeOverlay = useCallback(
    (loggedOutcome?: "clicked_result" | "asked_casewhy") => {
      if (loggedOutcome) {
        logEvent(loggedOutcome);
        setOutcomeLogged(true);
      } else if (!outcomeLogged && query.trim()) {
        logEvent("abandoned");
      }
      setOpen(false);
      setQuery("");
      setMobileExpanded(false);
      setOutcomeLogged(false);
      triggerRef.current?.focus();
    },
    [logEvent, outcomeLogged, query]
  );

  const openOverlay = useCallback((prefill?: string) => {
    triggerRef.current = document.activeElement as HTMLElement;
    setOpen(true);
    setOutcomeLogged(false);
    if (prefill) setQuery(prefill);
    // Focus after the dialog actually mounts.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Global open triggers: Cmd/Ctrl+K anywhere, and the openSiteSearch()
  // event bus (header icon, Resources menu box).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openOverlay();
      }
    }
    function handleOpenEvent(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      openOverlay(detail?.query);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(SEARCH_OPEN_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(SEARCH_OPEN_EVENT, handleOpenEvent);
    };
  }, [openOverlay]);

  // Close on route change (a result link navigated away).
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Content search: instant, from the lazily-loaded client index.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    searchContent(locale, query).then((r) => {
      if (!cancelled) setContent(r);
    });
    return () => {
      cancelled = true;
    };
  }, [open, locale, query]);

  // Directory search: debounced, server-side.
  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setDirectoryGroups([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/search/directory?q=${encodeURIComponent(debouncedQuery.trim())}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDirectoryGroups(data.groups ?? []);
      })
      .catch(() => {
        if (!cancelled) setDirectoryGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery, locale]);

  // Esc to close; a basic focus trap (Tab wraps within the dialog).
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOverlay]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => openOverlay()}
        aria-label={isSpanish ? "Buscar en CaseWhy" : "Search CaseWhy"}
        className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <SearchIcon />
      </button>
    );
  }

  const examples = isSpanish ? EXAMPLE_QUERIES_ES : EXAMPLE_QUERIES;
  const hasAnyContent = content.answers.length + content.reference.length + content.pages.length + directoryGroups.length > 0;
  const visibleTypes = mobileExpanded ? directoryGroups : directoryGroups.slice(0, 2);
  const hiddenTypeCount = directoryGroups.length - visibleTypes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh]" onClick={() => closeOverlay()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isSpanish ? "Buscar en CaseWhy" : "Search CaseWhy"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[75vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="border-b border-border p-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isSpanish
                ? "Buscar en CaseWhy — estados, formularios, políticas, ayuda cerca de usted"
                : "Search CaseWhy — statuses, forms, policy, help near you"
            }
            className="w-full bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="max-h-[calc(75vh-64px)] overflow-y-auto p-2">
          {!hasAnyContent && query.trim().length === 0 && (
            <div className="p-4 text-sm text-muted">
              <p className="mb-2 font-semibold text-foreground">{isSpanish ? "Prueba con:" : "Try:"}</p>
              <ul className="space-y-1">
                {examples.map((ex) => (
                  <li key={ex}>
                    <button type="button" className="text-brand-600 hover:underline dark:text-brand-400" onClick={() => setQuery(ex)}>
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasAnyContent && query.trim().length > 0 && (
            <div className="p-4 text-sm text-muted">
              <p className="mb-2">{isSpanish ? "No se encontraron resultados." : "No results found."}</p>
              <p className="mb-2 font-semibold text-foreground">{isSpanish ? "Prueba con:" : "Try:"}</p>
              <ul className="space-y-1">
                {examples.map((ex) => (
                  <li key={ex}>
                    <button type="button" className="text-brand-600 hover:underline dark:text-brand-400" onClick={() => setQuery(ex)}>
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.answers.length > 0 && (
            <ResultGroup title={isSpanish ? "Respuestas" : "Answers"}>
              {content.answers.map((r) => (
                <ContentResultRow key={r.id} doc={r} isSpanish={isSpanish} onNavigate={() => closeOverlay("clicked_result")} />
              ))}
            </ResultGroup>
          )}

          {content.reference.length > 0 && (
            <ResultGroup title={isSpanish ? "Referencia" : "Reference"}>
              {content.reference.map((r) => (
                <ContentResultRow key={r.id} doc={r} isSpanish={isSpanish} onNavigate={() => closeOverlay("clicked_result")} />
              ))}
            </ResultGroup>
          )}

          {directoryGroups.length > 0 && (
            <ResultGroup title={isSpanish ? "Obtener ayuda" : "Get Help"}>
              {visibleTypes.map((g) => (
                <div key={g.entityType} className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold text-foreground">
                    {isSpanish ? g.typeLabelEs : g.typeLabel} · {g.count}
                  </p>
                  {g.rows.map((row) => (
                    <Link
                      key={row.url}
                      href={row.url}
                      onClick={() => closeOverlay("clicked_result")}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
                    >
                      <span className="text-foreground">{row.name}</span>
                      {row.city && <span className="text-muted"> · {row.city.split(",")[0]}, {row.state}</span>}
                    </Link>
                  ))}
                  <Link
                    href={g.seeAllUrl}
                    onClick={() => closeOverlay("clicked_result")}
                    className="block px-3 py-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {isSpanish
                      ? `Ver los ${g.count} de ${g.typeLabelEs.toLowerCase()} →`
                      : `See all ${g.count} ${g.typeLabel.toLowerCase()} →`}
                  </Link>
                </div>
              ))}
              {hiddenTypeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setMobileExpanded(true)}
                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400 sm:hidden"
                >
                  {isSpanish ? `+${hiddenTypeCount} tipos más` : `+${hiddenTypeCount} more types`}
                </button>
              )}
            </ResultGroup>
          )}

          {content.pages.length > 0 && (
            <ResultGroup title={isSpanish ? "Páginas" : "Pages"}>
              {content.pages.map((r) => (
                <ContentResultRow key={r.id} doc={r} isSpanish={isSpanish} onNavigate={() => closeOverlay("clicked_result")} />
              ))}
            </ResultGroup>
          )}

          <div className="mt-1 border-t border-border p-1">
            <Link
              href={`${isSpanish ? "/es" : ""}/get-help/ask${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`}
              onClick={() => closeOverlay("asked_casewhy")}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-surface-2 dark:text-brand-400"
            >
              {isSpanish ? "¿No lo encontró? Pregúntele a CaseWhy →" : "Didn't find it? Ask CaseWhy →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
      {children}
    </div>
  );
}

function ContentResultRow({ doc, isSpanish, onNavigate }: { doc: IndexedDoc; isSpanish: boolean; onNavigate: () => void }) {
  const isEnFallback = isSpanish && doc.locale === "en";
  const isPlusPage = doc.url === "/plus" || doc.url === "/es/plus";
  return (
    <Link href={doc.url} onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
      <span className="text-foreground">
        {isPlusPage ? (
          <>
            CaseWhy <PlusBadge size="sm" />
          </>
        ) : (
          doc.title
        )}
      </span>
      {isEnFallback && <span className="ml-2 text-xs text-muted">(en inglés)</span>}
      {doc.snippet && <span className="block text-xs text-muted">{doc.snippet}</span>}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
