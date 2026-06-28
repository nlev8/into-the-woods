// Generate 4 photoreal candle product shots via Imagen 4 (Gemini API).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const KEY = readFileSync(".env.local", "utf8").match(/GEMINI_API_KEY=(.*)/)?.[1].trim();
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.IMG_MODEL || "imagen-4.0-generate-001";
const OUT = "public/cottage/products";
mkdirSync(OUT, { recursive: true });

const BASEPROMPT =
  "Photorealistic product photograph of a single lit amber glass candle in a jar with a warm glowing flame and a minimal kraft-paper label, resting on a moss-covered log in a misty old-growth forest at soft blue dusk. A few softly glowing mushrooms and warm bokeh fireflies in the dark background. Shallow depth of field, cinematic soft light, cozy cottagecore mood, centered product, square composition, high detail.";

const PRODUCTS = [
  { id: "mossgrove", accent: "nestled in lush green moss and fern fronds" },
  { id: "hollowpine", accent: "with pine needles, a small pinecone and fir sprigs beside it" },
  { id: "emberfern", accent: "with a warm amber glow and a curling fern frond beside it" },
  { id: "wildbirch", accent: "beside pale white birch bark in cool drifting mist" },
];

async function gen(prompt) {
  const r = await fetch(`${BASE}/models/${MODEL}:predict`, {
    method: "POST",
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } }),
  });
  const j = await r.json();
  if (j.error) { console.error("ERR", j.error.code, j.error.message); process.exit(2); }
  const b64 = j.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) { console.error("no image:", JSON.stringify(j).slice(0, 400)); process.exit(3); }
  return Buffer.from(b64, "base64");
}

for (const p of PRODUCTS) {
  console.log("generating", p.id, "…");
  const buf = await gen(`${BASEPROMPT} The candle is ${p.accent}.`);
  writeFileSync(`${OUT}/${p.id}.png`, buf);
  console.log("  saved", p.id, `${(buf.length / 1e3) | 0}KB`);
}
console.log("DONE");
