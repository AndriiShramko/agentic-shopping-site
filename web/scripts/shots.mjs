import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "http://127.0.0.1:8123";
const locales = (process.env.LOCALES ?? "en").split(",");
mkdirSync("evidence", { recursive: true });
const browser = await chromium.launch();
for (const loc of locales) {
  for (const [name, vp] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 375, height: 812 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/${loc}/`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const invisible = await page.evaluate(() => [...document.querySelectorAll("h1, main h2")].filter((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return Number(cs.opacity) < 0.9 || cs.visibility !== "visible" || r.width < 5 || r.height < 5; }).map((el) => el.textContent?.slice(0, 40)));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(loc, name, "invisibleHeadings:", JSON.stringify(invisible), "horizontalOverflow:", overflow, "lang:", await page.evaluate(() => document.documentElement.lang));
    await page.screenshot({ path: `evidence/${loc}-${name}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
