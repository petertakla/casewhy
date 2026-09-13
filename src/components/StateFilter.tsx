"use client";

// Shared state-dropdown + free-text-search filter, used across every
// directory-shaped "Get Help" entity type (accredited representatives,
// attorneys, and future entity types) — round 35's explicit instruction was
// to build this once, generically, rather than a one-off per entity type.
//
// A state dropdown alone would be the only filter, but a rigid city-level
// dropdown was considered and rejected: with only a few hundred entries
// spread across 50 states for most entity types, a city filter would return
// empty results for most towns. Free text (matched against whatever fields
// the caller folds into `searchText`) lets someone narrow within their
// selected state without that failure mode — no geocoding, no distance math.
//
// Takes pre-rendered, pre-derived items rather than extractor functions —
// the page itself is a Server Component (it fetches the directory), and
// functions can't cross the server/client boundary as props. Each caller
// builds its own entity-specific markup server-side and passes it down as
// `node`; this component only ever handles plain, serializable data.
//
// The selected state and search text are reflected in the URL's own query
// string (?state=&q=) rather than kept only in local component state —
// round 36's real bug: a permalink page's "back to all" link hard-linked to
// the bare list URL, silently dropping whatever filter the user had applied
// before clicking into an entry. Syncing to the URL means the list page's
// own address reflects the current filter, so a real browser back
// navigation (see BackLink.tsx) lands on that same filtered view instead of
// resetting to the unfiltered list — and, as a side benefit, a filtered view
// is now linkable/bookmarkable on its own.

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// All 50 states + DC. Some entity types will have zero current entries for
// a given state (a real data gap, not a bug) — still listed, disabled, so
// the dropdown reads as complete national coverage rather than silently
// omitting states with nothing in them yet.
const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export interface StateFilterItem {
  key: string;
  /** States this item is associated with — an array so a multi-state entity
   * (e.g. an attorney licensed in more than one state) can match several. */
  states: string[];
  /** Concatenated text the free-text search box matches against. */
  searchText: string;
  node: React.ReactNode;
}

interface StateFilterProps {
  items: StateFilterItem[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  // Round 79 — optional label overrides so casewhy.com/es's directory pages
  // can reuse this component as-is instead of forking it. Defaults keep
  // every existing English caller byte-for-byte unchanged.
  filterByStateLabel?: string;
  // A plain label rather than a function — this component is a Client
  // Component and the page passing this prop is a Server Component, so a
  // function prop (an "All states (N)" formatter) can't cross that
  // boundary. The item count is appended here instead.
  allStatesLabel?: string;
  noneYetLabel?: string;
}

export function StateFilter({
  items,
  searchPlaceholder = "Search by name, organization, or city",
  emptyMessage = "No entries match.",
  filterByStateLabel = "Filter by state",
  allStatesLabel = "All states",
  noneYetLabel = "(none yet)",
}: StateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedState, setSelectedState] = useState(() => searchParams.get("state") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  function updateUrl(nextState: string, nextSearch: string) {
    const params = new URLSearchParams();
    if (nextState) params.set("state", nextState);
    if (nextSearch) params.set("q", nextSearch);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const item of items) {
      for (const s of item.states) {
        c.set(s, (c.get(s) ?? 0) + 1);
      }
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedState && !item.states.includes(selectedState)) return false;
      if (q && !item.searchText.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, selectedState, search]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="state-filter-select" className="text-sm text-muted">
          {filterByStateLabel}
        </label>
        <select
          id="state-filter-select"
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            updateUrl(e.target.value, search);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">{allStatesLabel} ({items.length})</option>
          {STATES.map((s) => (
            <option key={s} value={s} disabled={!counts.has(s)}>
              {s} {counts.has(s) ? `(${counts.get(s)})` : noneYetLabel}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateUrl(selectedState, e.target.value);
          }}
          placeholder={searchPlaceholder}
          className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.key}>{item.node}</div>
          ))}
        </div>
      )}
    </div>
  );
}
