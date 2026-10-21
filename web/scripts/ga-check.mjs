// GA4 contract check (WEB-TECH-BASELINE §T6, Consent Mode basic). Replaces the 2026-09-07 check,
// which demanded GA hits BEFORE consent and passed on any 204.
//   BASE=http://127.0.0.1:8123 node scripts/ga-check.mjs      local build (python -m http.server 8123 -d out)
//   BASE=https://agentic-shopping.flyreelstudio.eu node scripts/ga-check.mjs
// Hits are recorded by an in-page tap on fetch/sendBeacon into sessionStorage: gtag batches events
// (~5 s) and flushes the batch on pagehide, and requests sent while a page unloads are invisible to
// Playwright/CDP (checked 2026-10-21 against a local HTTPS sink: lang_switch IS delivered).
// /g/collect is answered 204 locally by the test (nothing reaches GA reports) unless REAL=1.
// The lead form is always mocked (no real lead reaches the Telegram bot); form/exception checks
// run only when REAL!=1 so test conversions never land in the GA property.
import { chromium } from "playwright";

const BASE = (process.env.BASE ?? "http://127.0.0.1:8123").replace(/\/$/, "");
const REAL = process.env.REAL === "1";
const ID = "G-2288CN6DJW";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const GOOGLE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|analytics\.google\.com/;
const out = { base: BASE, real: REAL, checks: {}, fails: [] };
const ok = (k, v, info) => {
  out.checks[k] = { pass: !!v, ...(info !== undefined ? { info } : {}) };
  if (!v) out.fails.push(k);
};
const wait = (p, ms) => p.waitForTimeout(ms);

function tap() {
  const K = "__gaHits";
  const rec = (url, body) => {
    try {
      if (!/\/g\/collect/.test(String(url))) return;
      const a = JSON.parse(sessionStorage.getItem(K) || "[]");
      a.push({ url: String(url), body: typeof body === "string" ? body : "" });
      sessionStorage.setItem(K, JSON.stringify(a));
    } catch {
      /* ignore */
    }
  };
  const f = window.fetch;
  window.fetch = function (input, init) {
    rec(typeof input === "string" ? input : input && input.url, init && init.body);
    return f.apply(this, arguments);
  };
  if (navigator.sendBeacon) {
    const sb = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (u, d) => (rec(u, d), sb(u, d));
  }
}

/** GA4 hit -> events. Shared params in the query; a POST body carries one event per line. */
function parseHit(url, body) {
  const q = new URL(url).searchParams;
  const shared = Object.fromEntries(q.entries());
  const lines = (body || "").split(/\r?\n/).filter((l) => /(^|&)en=/.test(l));
  const evs = lines.length ? lines.map((l) => ({ ...shared, ...Object.fromEntries(new URLSearchParams(l).entries()) })) : [shared];
  return evs.filter((e) => e.en).map((e) => ({ en: e.en, gcs: e.gcs, tid: e.tid, e }));
}

async function context(browser, locale = "en-US") {
  const ctx = await browser.newContext({ locale, userAgent: UA, viewport: { width: 1366, height: 900 } });
  const log = { google: [], hits: [], own: [], csp: [] };
  if (!REAL) await ctx.route(/\/g\/collect/, (r) => r.fulfill({ status: 204, body: "" }));
  await ctx.route("**/api/lead", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"stored":true,"message_id":1}' }));
  await ctx.route("**/__ga_check_throw.js", (r) => r.fulfill({ contentType: "application/javascript", body: "setTimeout(function(){throw new Error('asa ga-check test error https://example.com/x?y=1')},0);" }));
  await ctx.addInitScript(tap);
  ctx.on("request", (q) => {
    const u = q.url();
    if (GOOGLE.test(u)) log.google.push(u);
    if (/\/api\/e$/.test(u)) log.own.push(u);
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && /Content Security Policy/i.test(m.text()) && log.csp.push(m.text().slice(0, 160)));
  return { ctx, page, log };
}
async function sync(page, log) {
  const raw = await page.evaluate(() => sessionStorage.getItem("__gaHits") || "[]").catch(() => "[]");
  log.hits = JSON.parse(raw).flatMap((h) => parseHit(h.url, h.body));
  return log.hits.length;
}
const evs = async (page, log, from, en) => (await sync(page, log), log.hits.slice(from).filter((h) => h.en === en));

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });

// 1) clean visit: nothing to Google, no own beacon, banner with two equal buttons
{
  const { ctx, page, log } = await context(browser);
  await page.goto(`${BASE}/en/`, { waitUntil: "load" });
  await wait(page, 4000);
  await page.mouse.wheel(0, 2500);
  await wait(page, 1500);
  ok("pre.noGoogleRequests", log.google.length === 0 && (await sync(page, log)) === 0, log.google.slice(0, 3));
  ok("pre.noOwnBeacon", log.own.length === 0, log.own.length);
  ok("pre.noGaCookies", (await ctx.cookies()).filter((c) => /^_ga/.test(c.name)).length === 0);
  const st = await page.evaluate(() =>
    ["reject", "accept"].map((k) => {
      const b = document.querySelector(`[data-consent="${k}"]`);
      if (!b) return null;
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { text: b.textContent.trim(), w: cs.fontWeight, fs: cs.fontSize, bg: cs.backgroundColor, bc: cs.borderTopColor, bw: cs.borderTopWidth, c: cs.color, h: Math.round(r.height), pl: cs.paddingLeft };
    }),
  );
  const [rj, ac] = st;
  ok("banner.bothButtons", rj && ac, st);
  ok("banner.equalWeight", rj && ac && ["w", "fs", "bg", "bc", "bw", "c", "h", "pl"].every((k) => rj[k] === ac[k]), st);
  ok("banner.enAcceptText", ac?.text === "Accept analytics", ac?.text);

  // 2) Accept -> gtag.js + exactly one GRANTED page_view with our tid
  await page.click('[data-consent="accept"]');
  await wait(page, 7000);
  const pv = await evs(page, log, 0, "page_view");
  ok("accept.gtagLoaded", log.google.some((u) => /gtag\/js\?id=G-2288CN6DJW/.test(u)));
  ok("accept.grantedPageView", pv.length === 1 && /^G1.1$/.test(pv[0].gcs || "") && pv[0].tid === ID, pv.map((p) => [p.gcs, p.tid]));
  ok("accept.consentAcceptEvent", (await evs(page, log, 0, "consent_accept")).length === 1);
  ok("accept.noAnonymizeIpOrPagePath", log.hits.every((h) => !("ep.anonymize_ip" in h.e) && !("ep.page_path" in h.e)));
  ok("accept.siteLangOnPageView", pv[0]?.e["ep.site_lang"] === "en", pv[0]?.e["ep.site_lang"]);
  const host = new URL(BASE).hostname;
  const cookies = (await ctx.cookies()).filter((c) => /^_ga/.test(c.name));
  ok("accept.cookiesOnHostOnly", cookies.length >= 1 && cookies.every((c) => c.domain.replace(/^\./, "") === host), cookies.map((c) => `${c.name}@${c.domain}`));

  // 3) cta_click with stable id + location; section_view once per section
  let n = await sync(page, log);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('#hero a[href="#install"]');
  for (let y = 0; y < 14; y++) {
    await page.mouse.wheel(0, 900);
    await wait(page, 250);
  }
  await wait(page, 6000);
  const cta = await evs(page, log, n, "cta_click");
  ok("event.ctaClick", cta.some((c) => c.e["ep.cta_id"] === "hero_install" && c.e["ep.cta_location"] === "hero"), cta.map((c) => c.e["ep.cta_id"]));
  const secs = (await evs(page, log, 0, "section_view")).map((h) => h.e["ep.section_id"]);
  ok("event.sectionView", secs.length >= 5 && new Set(secs).size === secs.length, secs);

  // 4) reload with stored consent -> exactly ONE page_view
  n = await sync(page, log);
  await page.reload({ waitUntil: "load" });
  await wait(page, 6000);
  const pv2 = await evs(page, log, n, "page_view");
  ok("reload.exactlyOnePageView", pv2.length === 1 && /^G1.1$/.test(pv2[0].gcs || ""), pv2.map((p) => p.gcs));
  ok("reload.noBannerWhenDecided", (await page.locator('[data-consent="accept"]').count()) === 0);

  // 5) lang_switch reaches GA although a full navigation follows (flushed on pagehide)
  n = await sync(page, log);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('header [data-testid="lang-pl"]').first().click();
  await page.waitForURL("**/pl/", { timeout: 15000 });
  await wait(page, 6000);
  const ls = await evs(page, log, n, "lang_switch");
  ok("event.langSwitch", ls.length === 1 && ls[0].e["ep.lang_to"] === "pl" && ls[0].e["ep.site_lang"] === "en", ls.map((h) => h.e["ep.lang_to"]));
  ok("lang.onePageViewOnNewLocale", (await evs(page, log, n, "page_view")).length === 1);

  // 6) contact_click (mailto) on the pl page
  n = await sync(page, log);
  await page.evaluate(() => document.querySelector('a[href^="mailto:"]')?.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('a[href^="mailto:"]').first().click();
  await wait(page, 6000);
  ok("event.contactClick", (await evs(page, log, n, "contact_click")).some((h) => h.e["ep.method"] === "email"));

  if (!REAL) {
    // 7) form events (lead mocked); generate_lead only after a 2xx
    n = await sync(page, log);
    await page.locator("#contact [role=radio]").first().click();
    await page.locator("#contact").locator("[role=radio]", { hasText: "Claude Code" }).click();
    await page.locator("input#contact").fill("TEST-ga-check@example.com");
    await page.locator("#contact input[type=checkbox]").check();
    await wait(page, 2600); // > 2 s time-to-submit
    await page.locator("#contact button[type=submit]").click();
    await page.waitForSelector('#contact [role="status"]', { timeout: 15000 });
    await wait(page, 6000);
    await sync(page, log);
    const names = log.hits.slice(n).map((h) => h.en);
    const gl = await evs(page, log, n, "generate_lead");
    ok("event.formStart", names.includes("form_start"));
    const steps = (await evs(page, log, n, "form_step")).map((h) => h.e["ep.step"]);
    ok("event.formStep", steps.length >= 3 && new Set(steps).size === steps.length, steps);
    ok("event.formSubmit", names.includes("form_submit"));
    ok("event.generateLead", gl.length === 1 && gl[0].e["ep.form_id"] === "lead" && !!gl[0].e["ep.lead_type"], gl.map((h) => [h.e["ep.form_id"], h.e["ep.lead_type"], h.e["ep.agent"]]));
    ok("event.noPiiInHits", !JSON.stringify(log.hits).includes("TEST-ga-check"));
    // 8) exception from a same-origin script (served by the test), URL stripped from the text
    n = await sync(page, log);
    await page.addScriptTag({ url: `${BASE}/__ga_check_throw.js` });
    await wait(page, 6000);
    const ex = await evs(page, log, n, "exception");
    ok("event.exception", ex.length === 1 && ex[0].e["ep.description"]?.length <= 100 && !/example\.com/.test(ex[0].e["ep.description"]), ex.map((h) => h.e));
  }

  // 9) withdraw from the footer: denied, ga-disable, cookies gone, no more hits
  await page.locator('footer [data-consent="settings"]').click();
  await wait(page, 500);
  const plTexts = await page.evaluate(() => ["reject", "accept"].map((k) => document.querySelector(`[data-consent="${k}"]`)?.textContent.trim()));
  ok("banner.plLabels", plTexts[0] === "Odrzucam" && plTexts[1] === "Akceptuję", plTexts);
  await page.click('[data-consent="reject"]');
  await wait(page, 1000);
  n = await sync(page, log);
  const g = log.google.length;
  const state = await page.evaluate((id) => ({ off: window[`ga-disable-${id}`], stored: localStorage.getItem("asa_consent"), dl: JSON.stringify((window.dataLayer || []).slice(-3).map((a) => Array.from(a))) }), ID);
  ok("withdraw.state", state.off === true && state.stored === "no" && /"consent","update",\{"analytics_storage":"denied"/.test(state.dl), state);
  ok("withdraw.cookiesDeleted", (await ctx.cookies()).filter((c) => /^_ga/.test(c.name)).length === 0, (await ctx.cookies()).filter((c) => /^_ga/.test(c.name)).map((c) => `${c.name}@${c.domain}`));
  await page.mouse.wheel(0, 4000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#hero a[href="#install"]').click();
  await wait(page, 6000);
  await page.reload({ waitUntil: "load" });
  await wait(page, 5000);
  await sync(page, log);
  ok("withdraw.noFurtherHits", log.hits.length === n, log.hits.slice(n).map((h) => h.en));
  ok("withdraw.reloadNoGoogle", log.google.length === g, log.google.slice(g));
  ok("withdraw.noCookiesAfterReload", (await ctx.cookies()).filter((c) => /^_ga/.test(c.name)).length === 0);
  ok("csp.noErrors", log.csp.length === 0, log.csp);
  await ctx.close();
}

// 10) Decline on first visit: gtag never loads, also not after reload
{
  const { ctx, page, log } = await context(browser, "pl-PL");
  await page.goto(`${BASE}/pl/`, { waitUntil: "load" });
  await wait(page, 3000);
  await page.click('[data-consent="reject"]');
  await page.mouse.wheel(0, 3000);
  await wait(page, 2000);
  await page.reload({ waitUntil: "load" });
  await wait(page, 4000);
  ok("decline.noGoogleEver", log.google.length === 0 && (await sync(page, log)) === 0, log.google.slice(0, 3));
  ok("decline.noOwnBeacon", log.own.length === 0, log.own.length);
  ok("decline.bannerStaysClosed", (await page.locator('[data-consent="accept"]').count()) === 0);
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 1));
console.log(out.fails.length ? `FAIL (${out.fails.join(", ")})` : `PASS (${Object.keys(out.checks).length} checks)`);
process.exit(out.fails.length ? 1 : 0);
