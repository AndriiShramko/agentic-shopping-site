import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto((process.env.BASE ?? "http://127.0.0.1:8123") + "/en/", { waitUntil: "networkidle" });
const bad = await page.evaluate(() => {
  const w = document.documentElement.clientWidth; const out = [];
  for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.right > w + 1 && r.width > 0) out.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 60), right: Math.round(r.right), text: (el.textContent || "").trim().slice(0, 40) }); }
  return out.slice(0, 15);
});
console.log(JSON.stringify(bad, null, 1));
await browser.close();
