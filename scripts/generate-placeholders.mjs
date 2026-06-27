import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";

const FRAMES = 120;

function lerp(a, b, t) { return a + (b - a) * t; }
function rgb(c) { return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }
function mix(a, b, t) { return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }

// One placeholder frame: a fake forward journey that evolves mundane -> magical.
function drawFrame(ctx, W, H, t) {
  // sky: grey dawn -> magical twilight
  const top = mix([58, 64, 70], [26, 18, 46], t);
  const bot = mix([90, 96, 98], [60, 40, 80], t);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // ground
  ctx.fillStyle = rgb(mix([22, 30, 24], [16, 12, 26], t));
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  // parallax tree rows (closer rows move/scale faster to fake forward travel)
  const rows = [0.18, 0.32, 0.5];
  rows.forEach((depth, ri) => {
    const scale = 0.5 + depth * (1 + t * 1.5);
    const y = H * (0.4 + depth * 0.3);
    const shade = mix([20, 34, 26], [30, 24, 44], t);
    ctx.fillStyle = rgb(shade);
    const spacing = 120 * scale;
    const offset = (t * 600 * (ri + 1)) % spacing;
    for (let x = -spacing; x < W + spacing; x += spacing) {
      const tx = x - offset;
      const h = 120 * scale, w = 40 * scale;
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx - w, y);
      ctx.lineTo(tx, y - h);
      ctx.lineTo(tx + w, y);
      ctx.closePath(); ctx.fill();
    }
  });

  // cottage grows as you approach; windows glow near the end
  const cs = lerp(0.05, 0.4, t) * Math.min(W, H);
  const cx = W / 2, cy = H * 0.6;
  ctx.fillStyle = rgb(mix([40, 36, 32], [30, 26, 30], t));
  ctx.fillRect(cx - cs / 2, cy - cs / 2, cs, cs);
  const glow = Math.max(0, (t - 0.55) / 0.45);
  ctx.fillStyle = `rgba(255,200,110,${glow})`;
  ctx.fillRect(cx - cs * 0.22, cy - cs * 0.1, cs * 0.16, cs * 0.18);
  ctx.fillRect(cx + cs * 0.06, cy - cs * 0.1, cs * 0.16, cs * 0.18);

  // fireflies appear late
  const fly = Math.max(0, (t - 0.6) / 0.4);
  for (let i = 0; i < 40; i++) {
    const fx = (i * 97.13 % W);
    const fy = H * 0.3 + ((i * 53.7) % (H * 0.5));
    ctx.fillStyle = `rgba(198,241,53,${fly * (0.4 + 0.6 * ((i % 5) / 5))})`;
    ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, Math.PI * 2); ctx.fill();
  }

  // frame counter so scrubbing correctness is visually obvious
  ctx.fillStyle = "rgba(236,230,218,0.5)";
  ctx.font = "16px monospace";
  ctx.fillText(`frame ${Math.round(t * (FRAMES - 1)) + 1}/${FRAMES}`, 16, H - 16);
}

async function render(dir, W, H) {
  mkdirSync(`${dir}/frames`, { recursive: true });
  for (let i = 0; i < FRAMES; i++) {
    const t = FRAMES === 1 ? 0 : i / (FRAMES - 1);
    const canvas = createCanvas(W, H);
    drawFrame(canvas.getContext("2d"), W, H, t);
    const buf = await canvas.encode("png");
    writeFileSync(`${dir}/frames/${String(i + 1).padStart(4, "0")}.png`, buf);
  }
  writeFileSync(`${dir}/manifest.json`, JSON.stringify({ frameCount: FRAMES, width: W, height: H, ext: "png", fps: 30 }));
  console.log(`wrote ${FRAMES} frames to ${dir}`);
}

await render("public/cottage", 1600, 900);
await render("public/cottage/mobile", 800, 450);
