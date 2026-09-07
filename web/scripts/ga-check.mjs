import { chromium } from "playwright";
const BASE = process.env.BASE ?? "https://agentic-shopping.flyreelstudio.eu";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const google = [], own = [];
page.on("response", (r) => {
  const u = r.url();
  if (/google-analytics|googletagmanager|analytics\.google/.test(u)) google.push({ u, s: r.status() });
  if (/\/api\/e$/.test(u)) own.push({ u, s: r.status() });
});
// 1) visitor who never touches the banner
await page.goto(`${BASE}/en/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const collectBefore = google.filter((g) => /\/g\/collect/.test(g.u));
console.log("no-consent visitor: own /api/e hits =", own.length, own.map((o) => o.s).join(","), "| GA cookieless /g/collect =", collectBefore.length, collectBefore.map((c) => c.s).join(","));
const cookiesBefore = (await ctx.cookies()).filter((c) => c.name.startsWith("_ga"));
console.log("GA cookies before consent =", cookiesBefore.length, "(must be 0)");
// 2) interact without consenting: funnel events still measured
await page.locator('a[href="#install"]').first().click();
await page.waitForTimeout(1500);
console.log("after a CTA click without consent: own hits =", own.length);
// 3) accept -> cookies + granted pings
await page.locator('[role="dialog"] button', { hasText: /Accept|Akceptuj|Aceptar|Прин/ }).click();
await page.waitForTimeout(3000);
await page.locator('a[href="#contact"]').first().click();
await page.waitForTimeout(2000);
const cookiesAfter = (await ctx.cookies()).filter((c) => c.name.startsWith("_ga"));
const collectAfter = google.filter((g) => /\/g\/collect/.test(g.u));
console.log("after Accept: GA cookies =", cookiesAfter.length, "| total /g/collect =", collectAfter.length, collectAfter.map((c) => c.s).join(","));
await browser.close();
const ok = own.length >= 2 && own.every((o) => o.s === 204) && collectBefore.length > 0 && cookiesBefore.length === 0 && cookiesAfter.length > 0;
console.log(ok ? "PASS" : "FAIL");
process.exit(ok ? 0 : 1);
