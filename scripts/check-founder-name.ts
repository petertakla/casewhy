// Round 111 follow-up — standing rule: everywhere CaseWhy publishes or
// sends, the founder is "Peter" (or "Peter, founder" / "Peter, founder of
// CaseWhy"). The last name never appears in product-facing content. This
// is a plain grep over src/, content/, and public/ -- the same "no live
// fetch, works straight off source" discipline as check-language-switcher
// and validate-jsonld. Deliberately excludes uscis-affidavit-request-draft.md
// and any *-task.md round doc at the repo root (internal engineering docs
// and formal government correspondence, both explicitly out of scope per
// the task doc -- a real legal name is required there, not a bug) and the
// GitHub org/repo path (Peter's call, not this check's).

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LAST_NAME = "Takla";

const SCAN_DIRS = ["src", "content", "public"];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const failures: string[] = [];

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const text = fs.readFileSync(file, "utf-8");
    if (text.includes(LAST_NAME)) {
      const relative = path.relative(ROOT, file);
      const lineNum = text.slice(0, text.indexOf(LAST_NAME)).split("\n").length;
      failures.push(`${relative}:${lineNum}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Founder-name check failed -- "${LAST_NAME}" found in product-facing content:`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('The founder is "Peter" everywhere CaseWhy publishes or sends -- see round 111 follow-up.');
  process.exit(1);
} else {
  console.log(`Founder-name check passed -- no "${LAST_NAME}" in src/, content/, or public/.`);
  process.exit(0);
}
