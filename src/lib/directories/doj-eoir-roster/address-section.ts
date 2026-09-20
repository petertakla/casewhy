// Parses the DOJ EOIR roster's own "Recognized Organization Address"
// appendix -- a single-column list, one block per organization: org name
// (sometimes with an office-type suffix folded onto the same line, e.g.
// "ABCD Allston Brighton NOC Extension Office"; sometimes with the office
// type on its own separate following line, e.g. "Principal Office" --
// both forms confirmed live 2026-09-19, a real inconsistency in the
// source, not a parsing bug to fix away), then street address line(s),
// then a "City, ST ZIP" line, then an optional phone line.
//
// Block boundaries are found by content, not by y-gap heuristics (gaps
// between blocks and gaps from within a block's own line-wraps turned out
// to be too close in practice to separate reliably by size alone): each
// block's own "City, ST ZIP" line is a hard, regex-detectable anchor, so
// walking forward from there (consuming an optional phone line
// immediately after) always lands exactly on the next block's first line.
// Confirmed live: the "Recognized Organization Address" header repeats on
// every appendix page (unlike the reps-table section, which doesn't
// really repeat a header at all -- see reps-section.ts) and appendix
// blocks never split across a page boundary (each page's content starts
// with a fresh org name and ends after a complete block), so this can run
// one page at a time with no cross-page state.

import { OrgAddressRecord } from "./types";

interface TextItem {
  str: string;
  x: number;
  y: number;
}

const US_STATES =
  "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR|VI|GU|AS|MP";
const CITY_LINE = new RegExp(`^(.+?),\\s*(${US_STATES})\\s+(\\d{4,5})(-?)(\\d{4})?$`);
const PHONE_LINE = /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const HEADER_LINE = /^Recognized Organization Address$/;

function parseBlock(lines: string[]): OrgAddressRecord | null {
  if (lines.length === 0) return null;
  const orgName = lines[0];
  let idx = 1;
  let officeType: string | null = null;
  if (idx < lines.length && /Office/i.test(lines[idx]) && !CITY_LINE.test(lines[idx])) {
    officeType = lines[idx];
    idx += 1;
  }

  const street: string[] = [];
  let city: string | null = null;
  let state: string | null = null;
  let zip5: string | null = null;
  let zip4: string | null = null;

  while (idx < lines.length) {
    const m = CITY_LINE.exec(lines[idx]);
    if (m) {
      city = m[1];
      state = m[2];
      zip5 = m[3].padStart(5, "0");
      zip4 = m[5] || null;
      idx += 1;
      break;
    }
    street.push(lines[idx]);
    idx += 1;
  }
  if (!city) return null;

  const zipFull = zip4 ? `${zip5}-${zip4}` : zip5;
  const phone = idx < lines.length && PHONE_LINE.test(lines[idx]) ? lines[idx] : null;

  return {
    name: orgName,
    officeType,
    streetAddress: street.length > 0 ? street.join(", ") : null,
    cityStateZip: `${city}, ${state} ${zipFull}`,
    state,
    phone,
  };
}

export function parseAddressSection(pages: TextItem[][]): Map<string, OrgAddressRecord> {
  const byName = new Map<string, OrgAddressRecord>();

  for (const page of pages) {
    const sorted = [...page]
      .filter((it) => it.str.trim() !== "")
      .sort((a, b) => b.y - a.y || a.x - b.x);

    // Reconstruct one string per visual line (items sharing the same y).
    const lines: string[] = [];
    let lastY: number | null = null;
    for (const it of sorted) {
      const text = it.str.trim();
      if (lastY !== null && Math.abs(it.y - lastY) < 1) {
        lines[lines.length - 1] += ` ${text}`;
      } else {
        lines.push(text);
        lastY = it.y;
      }
    }

    let cursor = 0;
    if (cursor < lines.length && HEADER_LINE.test(lines[cursor])) cursor += 1;

    let blockStart = cursor;
    let i = cursor;
    while (i < lines.length) {
      if (CITY_LINE.test(lines[i])) {
        let end = i + 1;
        if (end < lines.length && PHONE_LINE.test(lines[end])) end += 1;
        const block = parseBlock(lines.slice(blockStart, end));
        if (block) byName.set(block.name, block);
        blockStart = end;
        i = end;
      } else {
        i += 1;
      }
    }
  }

  return byName;
}
