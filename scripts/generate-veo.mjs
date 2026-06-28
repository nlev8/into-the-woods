// Generate one chained Veo segment (image-to-video, first+last frame interpolation).
// Usage: node scripts/generate-veo.mjs <ab|bc|cd> [model]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const KEY = readFileSync(".env.local", "utf8").match(/GEMINI_API_KEY=(.*)/)?.[1].trim();
if (!KEY) { console.error("no GEMINI_API_KEY in .env.local"); process.exit(1); }
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const KF = "/Users/alexc/Downloads/Cottagecore keyframes";

const SEGMENTS = {
  ab: { first: "Keyframe A.png", last: "Keyframe B.png",
    prompt: "Slow, steady forward dolly creeping deeper down the misty forest path, continuous and smooth, no cuts, no camera shake. The world quietly comes alive: the fog begins to thin, soft light warms, and bioluminescent mushrooms and the first fireflies start to glow along the path. Cinematic, photorealistic, calm, dreamlike." },
  bc: { first: "Keyframe B.png", last: "Keyframe C.png",
    prompt: "Slow, steady forward dolly continuing down the forest path, walking toward a small cottage that emerges from the parting fog ahead, its windows beginning to glow warm. Glowing mushrooms and drifting fireflies pass by. Continuous, smooth, no cuts. Cinematic, photorealistic, magical twilight." },
  cd: { first: "Keyframe C.png", last: "Keyframe D.png",
    prompt: "Slow, steady forward dolly approaching and arriving at the small glowing cottage at the end of the path, warm light spilling from its windows, surrounded by glowing mushrooms and fireflies at dusk. Continuous, smooth, no cuts. Cinematic, photorealistic, enchanted, serene." },
};

async function toJpegB64(path) {
  const img = await loadImage(path);
  const c = createCanvas(1920, 1080);
  const ctx = c.getContext("2d");
  const s = Math.max(1920 / img.width, 1080 / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (1920 - w) / 2, (1080 - h) / 2, w, h);
  return (await c.encode("jpeg", 90)).toString("base64");
}

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}/${path}`, {
    ...opts,
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  return r.json();
}

const seg = process.argv[2] || "ab";
const MODEL = process.argv[3] || "veo-3.1-fast-generate-preview";
const S = SEGMENTS[seg];
if (!S) { console.error("unknown segment", seg); process.exit(1); }

console.log(`[${seg}] model=${MODEL} — preparing frames`);
const [first, last] = await Promise.all([toJpegB64(`${KF}/${S.first}`), toJpegB64(`${KF}/${S.last}`)]);

const body = {
  instances: [{
    prompt: S.prompt,
    image: { bytesBase64Encoded: first, mimeType: "image/jpeg" },
    lastFrame: { bytesBase64Encoded: last, mimeType: "image/jpeg" },
  }],
  parameters: { aspectRatio: "16:9", resolution: "1080p", durationSeconds: 8, sampleCount: 1, personGeneration: "allow_adult" },
};

console.log(`[${seg}] submitting…`);
const sub = await api(`models/${MODEL}:predictLongRunning`, { method: "POST", body: JSON.stringify(body) });
if (sub.error) { console.error(`[${seg}] SUBMIT ERROR ${sub.error.code}: ${sub.error.message}`); process.exit(2); }
const op = sub.name;
console.log(`[${seg}] op=${op} — polling`);

let status;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  status = await api(op, { method: "GET" });
  if (status.error) { console.error(`[${seg}] POLL ERROR: ${status.error.message}`); process.exit(3); }
  process.stdout.write(status.done ? "done\n" : ".");
  if (status.done) break;
}
if (!status?.done) { console.error(`[${seg}] TIMEOUT`); process.exit(4); }

const uri =
  status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
  status.response?.generatedVideos?.[0]?.video?.uri;
if (!uri) { console.error(`[${seg}] NO URI. response=${JSON.stringify(status.response).slice(0, 800)}`); process.exit(5); }

console.log(`[${seg}] downloading video`);
const vr = await fetch(uri, { headers: { "x-goog-api-key": KEY } });
const buf = Buffer.from(await vr.arrayBuffer());
mkdirSync("public/cottage/segments", { recursive: true });
const out = `public/cottage/segments/seg-${seg}.mp4`;
writeFileSync(out, buf);
console.log(`[${seg}] SAVED ${out} (${(buf.length / 1e6).toFixed(1)} MB)`);
