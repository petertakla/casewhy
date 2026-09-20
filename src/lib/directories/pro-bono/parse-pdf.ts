// Round 122 follow-up — TypeScript port of
// scripts/parse-pro-bono-representation-pdf.py (round 58's column-aware
// parser for EOIR's "List of Pro Bono Legal Service Providers" PDF).
// Ported structure-for-structure (classify_row / group_entries /
// parse_entry) rather than redesigned, to keep the same battle-tested
// heuristics that already got this PDF's real quirks right (column-split
// boundary, Fax lines overwriting real Tel numbers, bullet-continuation
// swallowing the next org's name -- see the Python file's own header for
// the bugs those heuristics exist to dodge).
//
// One real difference from the Python original: pdfplumber's
// extract_words() returns individual WORDS, so that script has to
// reconstruct rows from word-level x/top positions. unpdf's
// extractTextItems already returns whole-line text runs for this PDF
// (confirmed by direct inspection) -- there's still a same-row merge step
// below (a line can still split across two items at a font/style change),
// but no word-by-word reconstruction is needed.
//
// The Python version isolates the page's top-margin legend and court
// header by pdfplumber "top" position (top<=45 legend, top<75 court
// header). This port uses content matching instead (legend lines and
// "Immigration Court"/"Hearing Location" headers are textually
// distinctive) rather than porting the exact y-coordinate thresholds --
// more robust to this being a different PDF library's coordinate origin,
// and to minor template drift between quarterly PDF regenerations.

import { getDocumentProxy, extractTextItems } from "unpdf";
import { STATE_NAMES, STATE_ABBR } from "./state-names";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const EMAIL_FULL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^(Tel|Phone)[:.]?\s*(.*)/i;
const FAX_RE = /^Fax[:.]?/i;
const WEB_RE = /^(www\.|https?:\/\/)/i;
const ZIP_STATE_RE = /,\s*([A-Za-z]{2})\s+\d{5}/;
const ADDRESS_START_RE = /^\d/;
const COLUMN_SPLIT_X = 275;

const LEGEND_LINE_RE =
  /^\*+\s*(Non-Profit Organization|Referral Service|Private Attorney)$|^https?:\/\/www\.justice\.gov|^Updated\s|^List of Pro Bono Legal Service Providers$/i;

type RowType = "BULLET" | "FAX" | "PHONE" | "WEBSITE" | "EMAIL" | "ADDRESS" | "NAME";

interface Row {
  x: number;
  y: number;
  text: string;
}

export interface ProBonoEntry {
  organizationName: string;
  isReferralService: boolean;
  streetAddress: string | null;
  cityStateZip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string | null;
  caseTypeLimits: string | null;
  intakePolicy: string | null;
  state: string;
  immigrationCourt: string;
}

function classifyRow(text: string): RowType {
  const s = text.trim();
  if (s.startsWith("•")) return "BULLET";
  if (FAX_RE.test(s)) return "FAX";
  if (/^(Tel|Phone)[:.]/i.test(s)) return "PHONE";
  if (WEB_RE.test(s)) return "WEBSITE";
  if (EMAIL_FULL_RE.test(s)) return "EMAIL";
  if (ADDRESS_START_RE.test(s) || s.startsWith("P.O.") || ZIP_STATE_RE.test(s)) return "ADDRESS";
  return "NAME";
}

function groupEntries(rows: Row[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  let prevType: RowType | null = null;

  for (const r of rows) {
    let rowType = classifyRow(r.text);
    const text = r.text.trim();
    const looksLikeFragment = !text.includes(" ") && /^[a-z]/.test(text);
    const looksLikeRealName = /\*{1,3}\s*$/.test(text);

    if (rowType === "NAME" && (prevType === "BULLET" || prevType === "ADDRESS") && !looksLikeRealName) {
      rowType = prevType;
    } else if (rowType === "NAME" && prevType === "WEBSITE" && looksLikeFragment) {
      rowType = prevType;
    }

    if (rowType === "NAME" && prevType !== null && prevType !== "NAME") {
      if (current.length > 0) blocks.push(current);
      current = [];
    }
    current.push(r.text);
    prevType = rowType;
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

function parseEntry(lines: string[], state: string, immigrationCourt: string): ProBonoEntry | null {
  if (lines.length === 0) return null;
  const nameLine = lines[0];
  const isReferral = nameLine.includes("**") && !nameLine.includes("***");
  const organizationName = nameLine.replace(/\*+\s*$/, "").trim();

  const entry: ProBonoEntry = {
    organizationName,
    isReferralService: isReferral,
    streetAddress: null,
    cityStateZip: null,
    phone: null,
    email: null,
    website: null,
    languages: null,
    caseTypeLimits: null,
    intakePolicy: null,
    state,
    immigrationCourt,
  };

  const addrParts: string[] = [];
  const caseTypeLimits: string[] = [];
  const intakePolicy: string[] = [];
  let prevType: RowType = "NAME";

  for (const line of lines.slice(1)) {
    const s = line.trim();
    if (!s) continue;
    let rowType = classifyRow(s);
    const looksLikeFragment = !s.includes(" ") && /^[a-z]/.test(s);
    const looksLikeRealName = /\*{1,3}\s*$/.test(s);

    if (rowType === "NAME" && (prevType === "BULLET" || prevType === "ADDRESS") && !looksLikeRealName) {
      rowType = prevType;
    } else if (rowType === "NAME" && prevType === "WEBSITE" && looksLikeFragment) {
      rowType = prevType;
    }

    if (rowType === "FAX") {
      // fax numbers aren't captured -- schema only has one phone field
    } else if (rowType === "PHONE") {
      const m = PHONE_RE.exec(s);
      entry.phone = m ? m[2].trim() : s;
    } else if (rowType === "EMAIL") {
      entry.email = s;
    } else if (rowType === "WEBSITE") {
      entry.website = entry.website ? entry.website + s : s;
    } else if (rowType === "BULLET") {
      const bullet = s.replace(/^•/, "").trim();
      if (/^languages?/i.test(bullet)) {
        entry.languages = bullet.replace(/^languages?:\s*/i, "");
      } else if (/walk-in|walk in|appointment/i.test(bullet)) {
        intakePolicy.push(bullet);
      } else {
        caseTypeLimits.push(bullet);
      }
    } else if (rowType === "ADDRESS") {
      if (ZIP_STATE_RE.test(s)) {
        entry.cityStateZip = s;
      } else {
        addrParts.push(s);
      }
    } else {
      addrParts.push(s);
    }
    prevType = rowType;
  }

  if (addrParts.length > 0) entry.streetAddress = addrParts.join(", ");
  entry.caseTypeLimits = caseTypeLimits.length > 0 ? caseTypeLimits.join("; ") : null;
  entry.intakePolicy = intakePolicy.length > 0 ? intakePolicy.join("; ") : null;
  return entry;
}

function isValid(entry: ProBonoEntry): boolean {
  if (entry.organizationName.length < 5 || !entry.organizationName.includes(" ")) return false;
  if (!entry.streetAddress && !entry.cityStateZip && !entry.phone && !entry.email && !entry.website) return false;
  return true;
}

// Merges items into rows by y-proximity WITHIN one column only -- merging
// before splitting into columns was the first real bug found while
// testing this port: a left-column row and a right-column row printed at
// the same height got concatenated into one nonsense string, silently
// fusing two unrelated organizations together (exactly the "naive
// extraction interleaves adjacent organizations" failure mode the
// original Python parser's own header comment describes and was written
// specifically to avoid).
function mergeSameRow(items: { str: string; x: number; y: number }[]): Row[] {
  const sorted = [...items].filter((it) => it.str.trim() !== "").sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - it.y) < 3) {
      last.text += it.str;
    } else {
      rows.push({ x: it.x, y: it.y, text: it.str });
    }
  }
  return rows;
}

export async function parseProBonoPdf(buf: Uint8Array): Promise<{ entries: ProBonoEntry[]; totalPages: number }> {
  const pdf = await getDocumentProxy(buf);
  const { items, totalPages } = await extractTextItems(pdf);

  const entries: ProBonoEntry[] = [];
  let currentState = "";
  let currentCourt = "";

  for (let p = 2; p < totalPages; p++) {
    const pageItems = items[p].filter((it) => it.str.trim() !== "" && !LEGEND_LINE_RE.test(it.str.trim()));
    if (pageItems.length === 0) continue;

    // Column split happens on the raw items, before any row-merging, so a
    // left/right pair sharing a y-coordinate can never be fused together.
    // The court header and state-divider text both consistently land left
    // of the split boundary (confirmed by direct inspection), so they're
    // detected from the left column only.
    const leftItems = pageItems.filter((it) => it.x < COLUMN_SPLIT_X);
    const rightItems = pageItems.filter((it) => it.x >= COLUMN_SPLIT_X);

    let leftRows = mergeSameRow(leftItems);
    const rightRows = mergeSameRow(rightItems);

    // State-divider page: a lone row (post-legend) whose entire text is a
    // known state name.
    if (leftRows.length <= 3 && rightRows.length === 0) {
      const candidate = leftRows.map((r) => r.text.trim()).join(" ").trim().toUpperCase();
      if (STATE_NAMES.has(candidate)) {
        currentState = candidate;
        continue;
      }
    }

    // Court header: the first row(s) mentioning "Immigration Court" /
    // "Hearing Location" -- same content check the Python version used,
    // just not gated to a y-position band first.
    for (let i = 0; i < Math.min(leftRows.length, 3); i++) {
      const t = leftRows[i].text.trim();
      if (t.includes("Immigration Court") || t.includes("Hearing Location")) {
        currentCourt = t;
        // The line right after the court name is usually "City, State
        // (page N of M)" -- informational only, schema has no field for
        // it, so both header lines are dropped from the left column's
        // real content rows.
        leftRows = leftRows.slice(i + 2);
        break;
      }
    }

    for (const colRows of [leftRows, rightRows]) {
      if (colRows.length === 0) continue;
      const blocks = groupEntries(colRows);
      for (const block of blocks) {
        const entry = parseEntry(block, STATE_ABBR[currentState] ?? currentState, currentCourt);
        if (!entry || entry.organizationName.length < 3) continue;
        entries.push(entry);
      }
    }
  }

  const valid = entries.filter(isValid);
  return { entries: valid, totalPages };
}

export async function fetchAndParseProBono(): Promise<{ entries: ProBonoEntry[]; totalPages: number }> {
  const resp = await fetch("https://www.justice.gov/eoir/file/probonofulllist/download", { headers: FETCH_HEADERS });
  if (!resp.ok) throw new Error(`EOIR pro bono PDF fetch returned ${resp.status}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  return parseProBonoPdf(buf);
}
