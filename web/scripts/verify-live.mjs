/* DoD verification (playbook §16): locales, switcher clicks, cookie memory, interactives, form e2e, GA gate. */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://127.0.0.1:8123";
const LEAD = process.env.LEAD === "1"; // real POST only when asked
mkdirSync("evidence", { recursive: true });
const out = { base: BASE, checks: {}, fails: [] };
const ok = (k, v, info) => { out.checks[k] = { pass: !!v, ...(info !== undefined ? { info } : {}) }; if (!v) out.fails.push(k); };
import { readFileSync } from "node:fs";
const MARKERS = Object.fromEntries(["en","es","pl","ru"].map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).hero.h1.slice(0, 40)]));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await ctx.newPage();
const googleReqs = [];
page.on("request", (r) => { if (/google-analytics|googletagmanager|doubleclick/.test(r.url())) googleReqs.push(r.url()); });

for (const loc of ["en", "es", "pl", "ru"]) {
  await page.goto(`${BASE}/${loc}/`, { waitUntil: "networkidle" });
  ok(`${loc}.lang`, (await page.evaluate(() => document.documentElement.lang)) === loc);
  const text = await page.evaluate(() => document.body.innerText);
  if (MARKERS[loc]) ok(`${loc}.marker`, text.includes(MARKERS[loc]));
  ok(`${loc}.h1`, (await page.locator("h1").count()) === 1);
  const invisible = await page.evaluate(() => [...document.querySelectorAll("h1, main h2:not(.sr-only)")].filter((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return Number(cs.opacity) < 0.9 || cs.visibility !== "visible" || r.width < 5; }).length);
  ok(`${loc}.headingsVisible`, invisible === 0, invisible);
  ok(`${loc}.jsonld`, (await page.locator('script[type="application/ld+json"]').count()) === 1);
  ok(`${loc}.noHorizontalOverflow`, !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
}
ok("ga.zeroRequestsWithoutConsent", googleReqs.length === 0, googleReqs.length);

// language switcher: click each chip from /en/, verify navigation + cookie
for (const to of ["es", "pl", "ru", "en"]) {
  await page.goto(`${BASE}/en/`, { waitUntil: "networkidle" });
  await page.locator(`header [data-testid="lang-${to}"]`).first().click();
  await page.waitForURL(`**/${to}/`, { timeout: 15000 });
  const cookie = (await ctx.cookies()).find((c) => c.name === "asa_lang");
  ok(`switch.${to}`, page.url().endsWith(`/${to}/`) && cookie?.value === to, { url: page.url(), cookie: cookie?.value });
}
// remembered choice: bare "/" should follow the cookie (only meaningful on the live nginx host)
if (/^https:/.test(BASE)) {
  await ctx.clearCookies();
  await ctx.addCookies([{ name: "asa_lang", value: "pl", domain: new URL(BASE).hostname, path: "/" }]);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("root.redirectByCookie", page.url().endsWith("/pl/"), page.url());
  await ctx.clearCookies();
  const p2 = await browser.newPage({ extraHTTPHeaders: { "Accept-Language": "ru-RU,ru;q=0.9" } });
  await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("root.redirectByAcceptLanguage", p2.url().endsWith("/ru/"), p2.url());
  await p2.close();
}

// interactives on /en/
await page.goto(`${BASE}/en/`, { waitUntil: "networkidle" });
await page.locator("#faq details").first().locator("summary").click();
ok("faq.opens", (await page.locator("#faq details[open]").count()) === 1);
await page.locator("#copy-prompt").scrollIntoViewIfNeeded();
await page.locator("#install button", { hasText: /Copy/ }).nth(1).click();
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
ok("copy.prompt", clip.includes("AGENT_SETUP.md"), clip.slice(0, 40));
// every link has a real target (no "#" placeholders)
const badLinks = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h || h === "#" || h.startsWith("javascript")));
ok("links.noPlaceholders", badLinks.length === 0, badLinks);
const anchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")).filter((h) => !document.querySelector(h)));
ok("links.anchorsResolve", anchors.length === 0, anchors);
// sticky CTA appears after scrolling past hero on mobile
const m = await browser.newPage({ viewport: { width: 375, height: 812 } });
await m.goto(`${BASE}/en/`, { waitUntil: "networkidle" });
await m.evaluate(() => document.getElementById("examples")?.scrollIntoView({ behavior: "instant" }));
await m.waitForTimeout(600);
ok("sticky.visibleOnMobile", await m.evaluate(() => { const el = document.querySelector('[aria-hidden="false"] a[href="#install"], .fixed.bottom-0'); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom <= innerHeight + 1; }));
await m.screenshot({ path: "evidence/mobile-sticky.png" });
await m.close();

// form: validation + partial + submit (real POST only with LEAD=1)
await page.goto(`${BASE}/en/#contact`, { waitUntil: "networkidle" });
const posts = [];
page.on("request", (r) => { if (r.url().endsWith("/api/lead") && r.method() === "POST") posts.push(JSON.parse(r.postData() || "{}")); });
if (!LEAD) await page.route("**/api/lead", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"stored":true,"message_id":1}' }));
const submit = page.locator("#contact button[type=submit]");
ok("form.submitDisabledUntilValid", await submit.isDisabled());
await page.locator("#contact [role=radio]").first().click();
await page.locator("#contact").locator("[role=radio]", { hasText: "Claude Code" }).click();
await page.locator("input#contact").fill("TEST-verify@example.com");
await page.locator("#contact input[type=checkbox]").check();
await page.waitForTimeout(800);
ok("form.partialCaptured", posts.some((p) => p.stage === "partial" && p.contact === "TEST-verify@example.com"), posts.length);
await page.locator("textarea#message").fill("TEST verify-live (automated DoD check, ignore)");
ok("form.submitEnabled", await submit.isEnabled());
await submit.click();
await page.waitForSelector('#contact [role="status"]', { timeout: 15000 });
ok("form.success", posts.some((p) => p.stage === "final" && p.tts > 2), posts.map((p) => p.stage));
await page.screenshot({ path: "evidence/form-success.png" });
writeFileSync("evidence/verify-live.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ fails: out.fails, passed: Object.values(out.checks).filter((c) => c.pass).length, total: Object.keys(out.checks).length }));
await browser.close();
process.exit(out.fails.length ? 1 : 0);
