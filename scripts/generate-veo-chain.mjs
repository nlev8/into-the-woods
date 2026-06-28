// Continuous chained Veo generation: each clip starts from the REAL last frame
// of the previous clip (not a pre-made still), so seams match and the scene
// keeps evolving. Image-to-video, forward dolly, Veo 3.1 Fast.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const KEY = readFileSync(".env.local", "utf8").match(/GEMINI_API_KEY=(.*)/)?.[1].trim();
if (!KEY) { console.error("no GEMINI_API_KEY"); process.exit(1); }
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.VEO_MODEL || "veo-3.1-fast-generate-preview";
const KF = "/Users/alexc/Downloads/Cottagecore keyframes";
const SEGDIR = "public/cottage/segments";
mkdirSync(SEGDIR, { recursive: true });

const STEPS = [
  { name: "c1", prompt: "Slow, steady, continuous forward dolly walking deeper down a misty grey forest path — smooth and gentle, the camera never stops or slows. The fog begins to thin and the very first hints of magic appear: one or two bioluminescent mushrooms start to glow softly and a single firefly drifts in. Photorealistic, cinematic, calm, dreamlike, continuous uninterrupted camera motion." },
  { name: "c2", prompt: "Continue the exact same slow, steady forward dolly down the forest path — the camera is already moving and must never stop or slow down. The magic steadily builds and accumulates and stays: more glowing teal and amber bioluminescent mushrooms light up along the path, more fireflies drift through the air, the warm light grows, the fog parts further, and a small cottage begins to appear faintly in the distance ahead. Photorealistic, cinematic, magical twilight, continuous uninterrupted motion." },
  { name: "c3", prompt: "Continue the exact same slow, steady forward dolly, never stopping, now approaching and arriving at a small glowing cottage at the end of the path — warm light spilling from its windows, abundant glowing mushrooms and drifting fireflies all around in the blue dusk. Photorealistic, cinematic, enchanted, serene, continuous uninterrupted motion." },
];

async function keyframeJpegB64(path) {
  const img = await loadImage(path);
  const c = createCanvas(1920, 1080);
  const ctx = c.getContext("2d");
  const s = Math.max(1920 / img.width, 1080 / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (1920 - w) / 2, (1080 - h) / 2, w, h);
  return (await c.encode("jpeg", 90)).toString("base64");
}

function realLastFrameB64(mp4) {
  // grab a frame very near the end (real rendered pixels) for seamless continuation
  execFileSync("ffmpeg", ["-y", "-sseof", "-0.12", "-i", mp4, "-frames:v", "1", "-q:v", "2", `${SEGDIR}/_lf.jpg`], { stdio: "ignore" });
  return readFileSync(`${SEGDIR}/_lf.jpg`).toString("base64");
}

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}/${path}`, { ...opts, headers: { "x-goog-api-key": KEY, "Content-Type": "application/json", ...(opts.headers || {}) } });
  return r.json();
}

async function gen(startB64, prompt, name) {
  const body = {
    instances: [{ prompt, image: { bytesBase64Encoded: startB64, mimeType: "image/jpeg" } }],
    parameters: { aspectRatio: "16:9", resolution: "1080p", durationSeconds: 8, sampleCount: 1, personGeneration: "allow_adult" },
  };
  console.log(`[${name}] submitting…`);
  const sub = await api(`models/${MODEL}:predictLongRunning`, { method: "POST", body: JSON.stringify(body) });
  if (sub.error) { console.error(`[${name}] SUBMIT ERROR ${sub.error.code}: ${sub.error.message}`); process.exit(2); }
  let status;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    status = await api(sub.name, { method: "GET" });
    if (status.error) { console.error(`[${name}] POLL ERROR: ${status.error.message}`); process.exit(3); }
    process.stdout.write(status.done ? "done\n" : ".");
    if (status.done) break;
  }
  if (!status?.done) { console.error(`[${name}] TIMEOUT`); process.exit(4); }
  const uri = status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || status.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) { console.error(`[${name}] NO URI`); process.exit(5); }
  const vr = await fetch(uri, { headers: { "x-goog-api-key": KEY } });
  const buf = Buffer.from(await vr.arrayBuffer());
  const out = `${SEGDIR}/seg-${name}.mp4`;
  writeFileSync(out, buf);
  console.log(`[${name}] SAVED ${out} (${(buf.length / 1e6).toFixed(1)} MB)`);
  return out;
}

let start = await keyframeJpegB64(`${KF}/Keyframe A.png`);
for (const step of STEPS) {
  const out = await gen(start, step.prompt, step.name);
  start = realLastFrameB64(out);
  console.log(`[${step.name}] extracted real last frame → next clip starts here`);
}
console.log("CHAIN DONE");
