import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://127.0.0.1:8123";
const loc = process.env.LOC ?? "en";
const browser = await chromium.launch();
for (const [name, vp] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 375, height: 812 }]]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`${BASE}/${loc}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `evidence/hero-${loc}-${name}.png` });
  for (const [sec, y] of [["flow", 0], ["examples", 0], ["install", 0]]) {
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView(), sec);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `evidence/${sec}-${loc}-${name}.png` });
  }
  await page.close();
}
await browser.close();
console.log("ok");
