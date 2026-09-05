// After `next build` (static export) rewrite <html lang="en"> to the folder's locale.
// Root layout can only carry one lang at build time; crawlers and screen readers need the
// correct one per page (playbook §1, patrol build-log 2026-07-12 pattern).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "out");
const LOCALES = ["en", "es", "pl", "ru"];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const locale of LOCALES) {
  const dir = join(OUT, locale);
  let files = [];
  try {
    files = walk(dir);
  } catch {
    continue;
  }
  for (const f of files) {
    const html = readFileSync(f, "utf8");
    const next = html.replace(/<html lang="en"/, `<html lang="${locale}"`);
    if (next !== html) {
      writeFileSync(f, next, "utf8");
      changed++;
    }
  }
}
console.log(`fix-lang: rewrote lang attribute in ${changed} file(s)`);
