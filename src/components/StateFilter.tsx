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

import { useMemo, useState } from "react";

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
}

export function StateFilter({
  items,
  searchPlaceholder = "Search by name, organization, or city",
  emptyMessage = "No entries match.",
}: StateFilterProps) {
  const [selectedState, setSelectedState] = useState("");
  const [search, setSearch] = useState("");

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
          Filter by state
        </label>
        <select
          id="state-filter-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All states ({items.length})</option>
          {STATES.map((s) => (
            <option key={s} value={s} disabled={!counts.has(s)}>
              {s} {counts.has(s) ? `(${counts.get(s)})` : "(none yet)"}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
