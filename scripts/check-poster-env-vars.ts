// Round 90 prep — the task doc's own spec asked for "every key in
// .env.example exists in Vercel Production (vercel env ls production in
// the workflow, names only)". That needs a VERCEL_TOKEN as a GitHub
// Actions repo secret, which doesn't exist yet -- creating one is a real,
// separate Vercel dashboard step for Peter, not something this check can
// set up for itself. Built the check the other direction instead, which
// needs no network call and no new secret, matching every other check:
// script in this repo (check-language-switcher.ts etc.): every
// process.env.X reference in the social-poster source files
// (src/lib/marketing/posters/*.ts) must have a line in .env.example. This
// catches the real failure mode that actually matters -- a poster added
// in a future round that reads a new env var nobody documented -- without
// needing Vercel API access from CI. Doesn't confirm Vercel Production
// actually HAS the var set; that's still worth doing once VERCEL_TOKEN
// exists as a repo secret, flagged as a real followup, not silently
// dropped.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTERS_DIR = path.join(ROOT, "src/lib/marketing/posters");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
// Platform-provided, not app config -- never belongs in .env.example.
const PLATFORM_VARS = new Set(["NODE_ENV"]);

function findEnvVarReferences(dir: string): Set<string> {
  const names = new Set<string>();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const n of findEnvVarReferences(full)) names.add(n);
      continue;
    }
    if (!entry.name.endsWith(".ts")) continue;
    const source = fs.readFileSync(full, "utf-8");
    for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

const referenced = findEnvVarReferences(POSTERS_DIR);
const envExample = fs.readFileSync(ENV_EXAMPLE_PATH, "utf-8");
const declared = new Set(
  [...envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1])
);

const missing = [...referenced].filter((name) => !declared.has(name) && !PLATFORM_VARS.has(name)).sort();

if (missing.length > 0) {
  console.error("check-poster-env-vars: these poster env vars are read in code but missing from .env.example:");
  for (const name of missing) console.error(`  - ${name}`);
  process.exit(1);
} else {
  console.log(`check-poster-env-vars: all ${referenced.size} poster env var(s) referenced in code are declared in .env.example.`);
  process.exit(0);
}
