// Round 110 — site-wide search's directory half. One endpoint over the
// six Get Help entity tables, grouped by type (Peter's Sep 15 revision:
// "saves time for the user" — sub-grouped, not a flat list), in Get
// Help's own canonical order.
//
// Correction, found before writing this (not assumed from the task doc):
// "reusing round 35's StateFilter query logic (name/org/city ILIKE...)"
// isn't actually possible -- StateFilter.tsx is a pure client-side
// filter over an already-fully-loaded array (see its own header comment);
// there is no DB-level ILIKE query anywhere in this codebase to reuse.
// Real ILIKE queries against each table are written fresh below, matching
// the same fields StateFilter's own searchText already concatenates per
// entity type (name/firm/city for attorneys, etc.) for behavioral
// consistency with what a user already expects from the directory pages
// themselves.
//
// Second correction: "rate-limited like the other public endpoints" also
// doesn't point at anything real -- the one existing "cap" in this
// codebase (anonymous-usage.ts's LIFETIME_CAP_PER_IP) is a lifetime
// feature cap tied to a paid AI call, not a reusable requests-per-minute
// limiter; no such shared utility exists to reuse. A small in-memory
// sliding-window limiter is built here instead, scoped to this route --
// appropriate for a read-only, DB-only endpoint (no per-call API cost,
// unlike the AI-backed ones), with the known accepted limitation that
// in-memory state doesn't survive across serverless instances/cold
// starts. Real query latency was measured directly before deciding this
// endpoint doesn't need a pg_trgm index yet: a warm-connection ILIKE scan
// against the largest table (dso_directory, 6,068 rows) took ~38ms,
// comfortably fast for a 250ms-debounced UI. Worth adding pg_trgm if
// table sizes grow an order of magnitude.

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { detectState } from "@/lib/search/state-detect";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitBuckets = new Map<string, number[]>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const hits = (rateLimitBuckets.get(clientKey) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitBuckets.set(clientKey, hits);
  return hits.length > RATE_LIMIT_MAX;
}

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

// Get Help's own canonical order (round 110 task doc, matching the
// order those directory pages are already presented in elsewhere).
interface EntityConfig {
  entityType: string;
  typeLabel: string;
  typeLabelEs: string;
  basePath: string;
  table: string;
  nameCol: string;
  cityCol: string;
  stateCol: string; // single "state" column or a states-list column
  stateIsList: boolean;
  extraSearchCols: string[];
  // Words that name this entity type itself ("attorney florida" should
  // match the Attorneys group by state alone, not require the literal
  // word "attorney" inside someone's name column) -- stripped from the
  // query before building this type's own ILIKE term. Caught via the
  // task doc's own Verify Live example ("attorney florida" returning
  // nothing against a name-only ILIKE search), not assumed up front.
  keywords: string[];
}

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    entityType: "attorneys",
    typeLabel: "Attorneys",
    typeLabelEs: "Abogados",
    basePath: "/attorneys",
    table: "attorney_directory",
    nameCol: "name",
    cityCol: "city_state_zip",
    stateCol: "states_licensed",
    stateIsList: true,
    extraSearchCols: ["firm"],
    keywords: ["attorney", "attorneys", "lawyer", "lawyers", "abogado", "abogados", "abogada", "abogadas"],
  },
  {
    entityType: "accredited-representatives",
    typeLabel: "Accredited representatives",
    typeLabelEs: "Representantes acreditados",
    basePath: "/accredited-representatives",
    table: "accredited_representative_directory",
    nameCol: "representative_name",
    cityCol: "city_state_zip",
    stateCol: "state",
    stateIsList: false,
    extraSearchCols: ["organization_name"],
    keywords: ["accredited", "representative", "representatives", "representante", "representantes", "acreditado", "acreditados"],
  },
  {
    entityType: "legal-aid",
    typeLabel: "Legal aid",
    typeLabelEs: "Asistencia legal",
    basePath: "/legal-aid",
    table: "legal_aid_directory",
    nameCol: "organization_name",
    cityCol: "city_state_zip",
    stateCol: "state",
    stateIsList: false,
    extraSearchCols: [],
    keywords: ["legal", "aid", "asistencia"],
  },
  {
    entityType: "pro-bono-representation",
    typeLabel: "Pro bono representation",
    typeLabelEs: "Representación pro bono",
    basePath: "/pro-bono-representation",
    table: "pro_bono_representation_directory",
    nameCol: "organization_name",
    cityCol: "city_state_zip",
    stateCol: "state",
    stateIsList: false,
    extraSearchCols: [],
    keywords: ["pro", "bono", "representation", "representación"],
  },
  {
    entityType: "dso",
    typeLabel: "International student offices",
    typeLabelEs: "Oficinas de estudiantes internacionales",
    basePath: "/dso",
    table: "dso_directory",
    nameCol: "school_name",
    cityCol: "city_state_zip",
    stateCol: "state",
    stateIsList: false,
    extraSearchCols: ["campus_name"],
    keywords: ["dso", "student", "students", "school", "university", "college", "estudiante", "estudiantes", "escuela", "universidad"],
  },
  {
    entityType: "community-orgs",
    typeLabel: "Community organizations",
    typeLabelEs: "Organizaciones comunitarias",
    basePath: "/community-orgs",
    table: "community_org_directory",
    nameCol: "organization_name",
    cityCol: "city_state_zip",
    stateCol: "state",
    stateIsList: false,
    extraSearchCols: [],
    keywords: ["community", "comunidad", "comunitaria", "comunitarias", "organization", "organizations", "organización", "organizaciones"],
  },
];

const STATE_WORDS = new Set([
  "florida", "texas", "california", "nueva", "york", "virginia", "occidental", "carolina", "norte", "sur",
  "dakota", "washington", "mexico", "méxico", "hampshire", "jersey", "alabama", "alaska", "arizona", "arkansas",
  "colorado", "connecticut", "delaware", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas",
  "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
  "missouri", "montana", "nebraska", "nevada", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode", "island",
  "tennessee", "utah", "vermont", "wisconsin", "wyoming",
]);

/** Strips this type's own keywords and any state-name words from the query, leaving only a real name/org search term (possibly empty). */
function stripTypeKeywordsAndState(query: string, cfg: EntityConfig): string {
  const keywordSet = new Set(cfg.keywords.map((k) => k.toLowerCase()));
  return query
    .split(/\s+/)
    .filter((word) => {
      const w = word.toLowerCase();
      return w.length > 0 && !keywordSet.has(w) && !STATE_WORDS.has(w) && !/^[a-z]{2}$/i.test(w);
    })
    .join(" ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const stateParam = (searchParams.get("state") ?? "").trim().toUpperCase();
  const locale = searchParams.get("locale") === "es" ? "es" : "en";

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(clientKey)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (q.length < 2) {
    return Response.json({ groups: [] satisfies DirectoryGroup[] });
  }

  const state = stateParam || detectState(q) || null;
  const db = getDb();

  const groups: DirectoryGroup[] = [];

  for (const cfg of ENTITY_CONFIGS) {
    // Per-type: strip this type's own keywords ("attorney", "legal aid",
    // Spanish equivalents) and any state-name words out of the query
    // before building the ILIKE term -- a query that's purely "attorney
    // florida" should surface the Attorneys group by state alone, not
    // require the literal word "attorney" to appear in someone's name.
    const remainingTerm = stripTypeKeywordsAndState(q, cfg);
    const hasNameFilter = remainingTerm.length > 0;
    const term = `%${remainingTerm}%`;

    const searchCols = [cfg.nameCol, ...cfg.extraSearchCols, cfg.cityCol];
    const searchClause = hasNameFilter
      ? sql`(${sql.join(
          searchCols.map((col) => sql`${sql.raw(col)} ILIKE ${term}`),
          sql` OR `
        )})`
      : sql`TRUE`;
    const stateClause = state
      ? cfg.stateIsList
        ? sql` AND ${sql.raw(cfg.stateCol)} ILIKE ${"%" + state + "%"}`
        : sql` AND ${sql.raw(cfg.stateCol)} = ${state}`
      : sql``;

    // A query that reduced to "no name filter, no state" for this type
    // (e.g. a query some OTHER type's keyword fully consumed) would
    // return this type's entire table -- skip rather than show
    // effectively-unfiltered results for a type the query didn't
    // actually ask about.
    if (!hasNameFilter && !state) continue;

    const countResult = await db.execute<{ count: string }>(
      sql`SELECT count(*)::text AS count FROM ${sql.raw(cfg.table)} WHERE ${searchClause}${stateClause}`
    );
    const count = parseInt(countResult.rows[0]?.count ?? "0", 10);
    if (count === 0) continue;

    const rowsResult = await db.execute<{ name: string; city: string | null; state: string; slug: string }>(
      sql`SELECT ${sql.raw(cfg.nameCol)} AS name, ${sql.raw(cfg.cityCol)} AS city, ${sql.raw(cfg.stateCol)} AS state, slug
          FROM ${sql.raw(cfg.table)}
          WHERE ${searchClause}${stateClause}
          ORDER BY ${sql.raw(cfg.nameCol)}
          LIMIT 2`
    );

    // The destination directory page's own StateFilter does the identical
    // literal-substring match this endpoint does (searchText.includes),
    // so it needs the same stripped term -- passing the raw "attorney
    // florida" through would 0-result there too, the same bug just fixed
    // for this endpoint's own count.
    const seeAllParams = new URLSearchParams();
    if (hasNameFilter) seeAllParams.set("q", remainingTerm);
    if (state) seeAllParams.set("state", state);
    if (locale === "es") seeAllParams.set("lang", "es");

    groups.push({
      entityType: cfg.entityType,
      typeLabel: cfg.typeLabel,
      typeLabelEs: cfg.typeLabelEs,
      count,
      rows: rowsResult.rows.map((r) => ({
        name: r.name,
        city: r.city,
        state: r.state,
        url: `${cfg.basePath}/${r.slug}`,
      })),
      seeAllUrl: `${cfg.basePath}?${seeAllParams.toString()}`,
    });
  }

  return Response.json({ groups });
}
