import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("verify-out", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://localhost:5173/", { waitUntil: "load" });
// wait for preloader to finish (canvas drawing)
await page.waitForTimeout(4000);

async function meanLuma(name, progress) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, p * max);
  }, progress);
  await page.waitForTimeout(1200); // let eased scrub settle
  await page.screenshot({ path: `verify-out/${name}.png` });
  return page.evaluate(() => {
    const c = document.querySelector("canvas");
    const ctx = c.getContext("2d");
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4 * 200) sum += data[i] + data[i + 1] + data[i + 2];
    return sum;
  });
}

const start = await meanLuma("start", 0.02);
const mid = await meanLuma("mid", 0.5);
const end = await meanLuma("end", 0.98);

const nonBlank = start > 0 && mid > 0 && end > 0;
const changed = new Set([start, mid, end]).size === 3; // frames differ as we scrub
console.log("errors:", errors.length, "| nonBlank:", nonBlank, "| frames change on scroll:", changed);
if (!nonBlank || !changed || errors.length) { console.error("VERIFY FAILED"); process.exit(1); }
console.log("VERIFY PASSED");
await browser.close();
