#!/usr/bin/env node
// Round 93 Part B — this is the static marketing site (no build step, no
// TypeScript, no serializer): every JSON-LD block here is hand-typed
// directly into the HTML, which is exactly the failure mode a real
// JSON.stringify()-based JSON-LD block can never have. Scans every
// *.html file in the repo for <script type="application/ld+json"> blocks
// and JSON.parse()s each one; exits non-zero (failing CI) on the first
// real parse error, printing the file and the parser's own message.

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function findHtmlFiles(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      results.push(full);
    }
  }
  return results;
}

let failures = 0;
let checked = 0;

for (const file of findHtmlFiles(ROOT)) {
  const content = readFileSync(file, "utf-8");
  let match;
  while ((match = SCRIPT_RE.exec(content)) !== null) {
    checked++;
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed["@context"] || !parsed["@type"]) {
        throw new Error("missing required @context/@type");
      }
    } catch (err) {
      failures++;
      console.error(`FAIL [${file.replace(ROOT + "/", "")}]: ${err.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${checked} JSON-LD block(s) failed validation.`);
  process.exit(1);
} else {
  console.log(`All ${checked} JSON-LD block(s) across the static site validated.`);
  process.exit(0);
}
