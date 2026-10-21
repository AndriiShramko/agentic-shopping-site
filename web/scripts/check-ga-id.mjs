// Build guard (postbuild + before every deploy): FAIL unless every locale page of web/out loads
// a script that contains this exact GA4 measurement id, and no page loads gtag.js statically
// (gtag may only be injected after "Accept" — WEB-TECH-BASELINE §T6, Consent Mode basic).
// Why: Drony Bydgoszcz lost GA for 8 days because a release was built without the env var;
// this site's id is committed in src/lib/track.ts, and this check proves it reached the bundle.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ID = "G-2288CN6DJW";
const OUT = join(process.cwd(), "out");
const LOCALES = ["en", "es", "pl", "ru"];
const fails = [];

const src = readFileSync(join(process.cwd(), "src/lib/track.ts"), "utf8");
if (!src.includes(`"${ID}"`)) fails.push(`src/lib/track.ts does not contain ${ID}`);

for (const l of LOCALES) {
  const f = join(OUT, l, "index.html");
  if (!existsSync(f)) {
    fails.push(`missing ${f}`);
    continue;
  }
  const html = readFileSync(f, "utf8");
  if (/googletagmanager\.com\/gtag\/js/.test(html)) fails.push(`${l}: gtag.js referenced in static HTML (must load only after consent)`);
  const srcs = [...html.matchAll(/<script[^>]+src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
  const hit = srcs.some((s) => {
    const p = join(OUT, decodeURIComponent(s)); // "/app/%5Blocale%5D/..." -> "[locale]"
    return existsSync(p) && readFileSync(p, "utf8").includes(ID);
  });
  if (!hit) fails.push(`${l}: none of ${srcs.length} page scripts contains ${ID}`);
}

if (fails.length) {
  console.error(`check-ga-id: FAIL\n - ${fails.join("\n - ")}`);
  process.exit(1);
}
console.log(`check-ga-id: OK (${ID} in the bundle of ${LOCALES.length} locale pages, no static gtag.js)`);
