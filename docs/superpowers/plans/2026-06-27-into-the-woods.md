# Into the Woods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone Vite + React app that scrubs a photoreal image-sequence frame-by-frame to scroll, telling a mundane→magical "into the woods" journey, with placeholder frames so it works today and a hot-swappable contract for real Higgsfield/Seedance footage.

**Architecture:** A pure canvas-2D scroll-scrub player. Scroll progress (0→1) maps to an eased frame index; the matching preloaded image is drawn cover-fit to a sticky full-viewport canvas each rAF. A `manifest.json` decouples the player from frame production. Placeholder frames are generated procedurally in Node; real frames come from AI video extracted via ffmpeg.

**Tech Stack:** Vite, React 18, TypeScript, lenis (smooth scroll), Vitest (unit), @playwright/test (integration verify), @napi-rs/canvas (placeholder generation, dev-only). No three.js/R3F.

## Global Constraints

- Project lives at repo root `/Users/alexc/into-the-woods` (standalone git repo; unrelated to Opticlaw).
- Pure client-side; no backend/SSR/auth.
- Frame contract is authoritative: `public/cottage/frames/####.<ext>` (1-based, zero-padded to 4) + `public/cottage/manifest.json` with shape `{ frameCount:number, width:number, height:number, ext:string, fps:number }`.
- Default render targets: ~180 frames; 1600×900 desktop, 800×450 mobile (`public/cottage/mobile/`). Placeholder frames may be fewer/PNG; the player reads everything from the manifest.
- Image sequence (NOT a scrubbed `<video>`) for frame-accuracy across browsers.
- Overlay opacity is driven via direct DOM writes (no React re-render on scroll).
- Fallbacks: `prefers-reduced-motion` → static key frame (no scrub easing); coarse-pointer/`<768px` → mobile sequence.

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Interfaces:**
- Produces: a running Vite dev server; `App` React component (default export) rendering a placeholder div.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "into-the-woods",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "gen:placeholders": "node scripts/generate-placeholders.mjs",
    "verify": "node scripts/verify.mjs"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd /Users/alexc/into-the-woods
npm install react react-dom lenis
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  vitest jsdom @playwright/test @napi-rs/canvas
npx playwright install chromium
```
Expected: installs succeed; `node_modules` present.

- [ ] **Step 3: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "useDefineForClassFields": true, "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "noEmit": true,
    "jsx": "react-jsx", "strict": true, "noUnusedLocals": true, "noUnusedParameters": true
  },
  "include": ["src"]
}
```
`tsconfig.node.json`:
```json
{ "compilerOptions": { "composite": true, "module": "ESNext", "moduleResolution": "bundler", "allowSyntheticDefaultImports": true }, "include": ["vite.config.ts"] }
```
`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom" },
});
```

- [ ] **Step 4: Create entry files**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Into the Woods</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
`src/index.css`:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #0c0f10; color: #ece6da; }
body { overflow-x: clip; font-family: ui-sans-serif, system-ui, sans-serif; }
```
`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
`src/App.tsx`:
```tsx
export default function App() {
  return <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>into the woods</div>;
}
```

- [ ] **Step 5: Verify it runs**

Run: `npm run dev` then in another shell `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/`
Expected: `200`. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite + react + ts project"
```

---

### Task 2: Frame math (pure functions, TDD)

**Files:**
- Create: `src/sequence/frameMath.ts`
- Test: `src/sequence/frameMath.test.ts`

**Interfaces:**
- Produces:
  - `progressToIndex(progress: number, frameCount: number): number`
  - `damp(current: number, target: number, lambda: number, dt: number): number`
  - `interface CoverRect { dx: number; dy: number; dw: number; dh: number }`
  - `coverRect(cw: number, ch: number, iw: number, ih: number): CoverRect`

- [ ] **Step 1: Write the failing test**

`src/sequence/frameMath.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { progressToIndex, damp, coverRect } from "./frameMath";

describe("progressToIndex", () => {
  it("maps endpoints", () => {
    expect(progressToIndex(0, 180)).toBe(0);
    expect(progressToIndex(1, 180)).toBe(179);
  });
  it("clamps out-of-range", () => {
    expect(progressToIndex(-0.5, 180)).toBe(0);
    expect(progressToIndex(2, 180)).toBe(179);
  });
  it("handles empty", () => {
    expect(progressToIndex(0.5, 0)).toBe(0);
  });
});

describe("damp", () => {
  it("moves toward target and converges", () => {
    expect(damp(0, 10, 8, 1)).toBeGreaterThan(0);
    expect(damp(0, 10, 8, 1)).toBeLessThan(10);
    let v = 0;
    for (let i = 0; i < 100; i++) v = damp(v, 10, 8, 0.05);
    expect(v).toBeCloseTo(10, 1);
  });
});

describe("coverRect", () => {
  it("fills and centers a wide image in a tall canvas", () => {
    const r = coverRect(100, 200, 200, 100); // image very wide
    expect(r.dw).toBeGreaterThanOrEqual(100);
    expect(r.dh).toBeGreaterThanOrEqual(200);
    expect(r.dx).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sequence/frameMath.test.ts`
Expected: FAIL (module not found / functions undefined).

- [ ] **Step 3: Write the implementation**

`src/sequence/frameMath.ts`:
```ts
export function progressToIndex(progress: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  const p = Math.min(Math.max(progress, 0), 1);
  return Math.min(frameCount - 1, Math.round(p * (frameCount - 1)));
}

// Frame-rate-independent exponential approach toward target.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export interface CoverRect { dx: number; dy: number; dw: number; dh: number }

export function coverRect(cw: number, ch: number, iw: number, ih: number): CoverRect {
  if (iw <= 0 || ih <= 0) return { dx: 0, dy: 0, dw: cw, dh: ch };
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { dx: (cw - dw) / 2, dy: (ch - dh) / 2, dw, dh };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sequence/frameMath.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 5: Commit**

```bash
git add src/sequence/frameMath.ts src/sequence/frameMath.test.ts
git commit -m "feat: frame math (progressToIndex, damp, coverRect)"
```

---

### Task 3: Manifest type + loader (TDD)

**Files:**
- Create: `src/sequence/manifest.ts`
- Test: `src/sequence/manifest.test.ts`

**Interfaces:**
- Produces:
  - `interface FrameManifest { frameCount: number; width: number; height: number; ext: string; fps: number }`
  - `parseManifest(data: unknown): FrameManifest`
  - `frameUrl(base: string, index: number, ext: string): string`
  - `loadManifest(url: string): Promise<FrameManifest>`

- [ ] **Step 1: Write the failing test**

`src/sequence/manifest.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseManifest, frameUrl } from "./manifest";

describe("parseManifest", () => {
  it("accepts a valid manifest", () => {
    const m = parseManifest({ frameCount: 180, width: 1600, height: 900, ext: "webp", fps: 30 });
    expect(m.frameCount).toBe(180);
    expect(m.ext).toBe("webp");
  });
  it("defaults ext and fps", () => {
    const m = parseManifest({ frameCount: 10, width: 800, height: 450 });
    expect(m.ext).toBe("webp");
    expect(m.fps).toBe(30);
  });
  it("rejects bad frameCount", () => {
    expect(() => parseManifest({ frameCount: 0, width: 1, height: 1 })).toThrow();
  });
});

describe("frameUrl", () => {
  it("zero-pads to 4 and is 1-based", () => {
    expect(frameUrl("/cottage", 0, "png")).toBe("/cottage/frames/0001.png");
    expect(frameUrl("/cottage", 179, "webp")).toBe("/cottage/frames/0180.webp");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sequence/manifest.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

`src/sequence/manifest.ts`:
```ts
export interface FrameManifest {
  frameCount: number;
  width: number;
  height: number;
  ext: string;
  fps: number;
}

export function parseManifest(data: unknown): FrameManifest {
  const m = (data ?? {}) as Partial<FrameManifest>;
  if (typeof m.frameCount !== "number" || m.frameCount <= 0) throw new Error("manifest: frameCount must be > 0");
  if (typeof m.width !== "number" || typeof m.height !== "number") throw new Error("manifest: width/height required");
  return {
    frameCount: m.frameCount,
    width: m.width,
    height: m.height,
    ext: typeof m.ext === "string" ? m.ext : "webp",
    fps: typeof m.fps === "number" ? m.fps : 30,
  };
}

export function frameUrl(base: string, index: number, ext: string): string {
  const n = String(index + 1).padStart(4, "0");
  return `${base}/frames/${n}.${ext}`;
}

export async function loadManifest(url: string): Promise<FrameManifest> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
  return parseManifest(await res.json());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sequence/manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sequence/manifest.ts src/sequence/manifest.test.ts
git commit -m "feat: frame manifest type, parser, url builder"
```

---

### Task 4: Frame-sequence loader hook

**Files:**
- Create: `src/sequence/useFrameSequence.ts`

**Interfaces:**
- Consumes: `loadManifest`, `frameUrl`, `FrameManifest` (Task 3).
- Produces:
  - `interface Sequence { manifest: FrameManifest | null; images: HTMLImageElement[]; progress: number; ready: boolean; error: string | null }`
  - `useFrameSequence(base: string): Sequence`

- [ ] **Step 1: Write the implementation**

`src/sequence/useFrameSequence.ts`:
```ts
import { useEffect, useState } from "react";
import { FrameManifest, loadManifest, frameUrl } from "./manifest";

export interface Sequence {
  manifest: FrameManifest | null;
  images: HTMLImageElement[];
  progress: number;
  ready: boolean;
  error: string | null;
}

const INITIAL: Sequence = { manifest: null, images: [], progress: 0, ready: false, error: null };

export function useFrameSequence(base: string): Sequence {
  const [state, setState] = useState<Sequence>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    setState(INITIAL);

    (async () => {
      try {
        const manifest = await loadManifest(`${base}/manifest.json`);
        const images: HTMLImageElement[] = new Array(manifest.frameCount);
        let loaded = 0;

        await Promise.all(
          Array.from({ length: manifest.frameCount }, (_, i) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.decoding = "async";
              const done = () => {
                images[i] = img;
                loaded += 1;
                if (!cancelled) setState((s) => ({ ...s, manifest, progress: loaded / manifest.frameCount }));
                resolve();
              };
              img.onload = done;
              img.onerror = done; // keep the index; draw-loop skips broken images
              img.src = frameUrl(base, i, manifest.ext);
            })
          )
        );

        if (!cancelled) setState({ manifest, images, progress: 1, ready: true, error: null });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, error: (e as Error).message }));
      }
    })();

    return () => { cancelled = true; };
  }, [base]);

  return state;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no errors. (Behavior is covered by the Task 8 integration verify.)

- [ ] **Step 3: Commit**

```bash
git add src/sequence/useFrameSequence.ts
git commit -m "feat: useFrameSequence hook (manifest load + image preload)"
```

---

### Task 5: Preloader + Overlays UI

**Files:**
- Create: `src/ui/Preloader.tsx`, `src/ui/Overlays.tsx`

**Interfaces:**
- Produces:
  - `Preloader(props: { progress: number; error: string | null }): JSX.Element`
  - `Overlays = forwardRef<HTMLDivElement>` — renders narrative beats with `data-beat` attributes.
  - `updateOverlayOpacity(root: HTMLDivElement, progress: number): void`

- [ ] **Step 1: Create `Preloader`**

`src/ui/Preloader.tsx`:
```tsx
export function Preloader({ progress, error }: { progress: number; error: string | null }) {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "grid", placeItems: "center",
      background: "#0c0f10", color: "#ece6da", zIndex: 10,
    }}>
      <div style={{ textAlign: "center", width: 260 }}>
        <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6 }}>
          {error ? "failed to load" : "entering the woods"}
        </p>
        {!error && (
          <div style={{ marginTop: 14, height: 2, background: "rgba(236,230,218,0.15)" }}>
            <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "#c8b27a", transition: "width 120ms linear" }} />
          </div>
        )}
        {error && <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `Overlays` + `updateOverlayOpacity`**

`src/ui/Overlays.tsx`:
```tsx
import { forwardRef } from "react";

const beatStyle: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, textAlign: "center",
  color: "#f3eede", pointerEvents: "none", padding: "0 24px",
  textShadow: "0 2px 30px rgba(0,0,0,0.6)",
};

export const Overlays = forwardRef<HTMLDivElement>(function Overlays(_props, ref) {
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
      <div data-beat="intro" style={{ ...beatStyle, top: "16vh" }}>
        <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6 }}>Scroll to wander</p>
        <h1 style={{ marginTop: 12, fontSize: "clamp(2rem,6vw,4.5rem)", fontWeight: 300 }}>Into the woods</h1>
      </div>
      <div data-beat="mid" style={{ ...beatStyle, top: "44vh", opacity: 0 }}>
        <p style={{ fontSize: "clamp(1rem,2.4vw,1.4rem)", opacity: 0.85 }}>something here is awake</p>
      </div>
      <div data-beat="arrive" style={{ ...beatStyle, bottom: "16vh", opacity: 0 }}>
        <h2 style={{ fontSize: "clamp(1.6rem,5vw,3.4rem)", fontWeight: 300 }}>You found it.</h2>
      </div>
    </div>
  );
});

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function updateOverlayOpacity(root: HTMLDivElement, progress: number) {
  const set = (beat: string, value: number) => {
    const el = root.querySelector<HTMLElement>(`[data-beat="${beat}"]`);
    if (el) el.style.opacity = String(value);
  };
  set("intro", clamp01(1 - progress * 7));                 // fades out early
  set("mid", smoothstep(0.4, 0.5, progress) * (1 - smoothstep(0.62, 0.72, progress))); // pulses mid
  set("arrive", smoothstep(0.82, 0.96, progress));         // fades in at the end
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Preloader.tsx src/ui/Overlays.tsx
git commit -m "feat: preloader + scroll-synced overlay beats"
```

---

### Task 6: ScrollSequence player + App wiring

**Files:**
- Create: `src/sequence/ScrollSequence.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useFrameSequence` (T4), `progressToIndex`/`damp`/`coverRect` (T2), `Preloader`/`Overlays`/`updateOverlayOpacity` (T5).
- Produces: `ScrollSequence(props: { base: string; pages?: number }): JSX.Element`

- [ ] **Step 1: Create `ScrollSequence`**

`src/sequence/ScrollSequence.tsx`:
```tsx
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { progressToIndex, damp, coverRect } from "./frameMath";
import { useFrameSequence } from "./useFrameSequence";
import { Preloader } from "../ui/Preloader";
import { Overlays, updateOverlayOpacity } from "../ui/Overlays";

export function ScrollSequence({ base, pages = 6 }: { base: string; pages?: number }) {
  const seq = useFrameSequence(base);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlaysRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const easedRef = useRef(0);

  // Scroll → progress (ref only, no re-render); overlay opacity via DOM.
  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-el.getBoundingClientRect().top / total, 0), 1) : 0;
      progressRef.current = p;
      if (overlaysRef.current) updateOverlayOpacity(overlaysRef.current, p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lenis smooth scroll (desktop, non-reduced-motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  // Draw loop.
  useEffect(() => {
    if (!seq.ready || !seq.manifest) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frameCount = seq.manifest.frameCount;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = progressToIndex(progressRef.current, frameCount);
      easedRef.current = reduce ? target : damp(easedRef.current, target, 9, dt);
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(easedRef.current)));
      const img = seq.images[idx];
      if (img && img.naturalWidth > 0) {
        const r = coverRect(window.innerWidth, window.innerHeight, img.naturalWidth, img.naturalHeight);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [seq.ready, seq.manifest, seq.images]);

  return (
    <div ref={wrapRef} style={{ height: `${pages * 100}vh`, position: "relative", background: "#0c0f10" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
        <Overlays ref={overlaysRef} />
        {!seq.ready && <Preloader progress={seq.progress} error={seq.error} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire `App` (with mobile sequence selection)**

`src/App.tsx`:
```tsx
import { useMemo } from "react";
import { ScrollSequence } from "./sequence/ScrollSequence";

export default function App() {
  const base = useMemo(() => {
    if (typeof window === "undefined") return "/cottage";
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return mobile ? "/cottage/mobile" : "/cottage";
  }, []);
  return <ScrollSequence base={base} />;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: no errors. (Runtime verified in Task 8 after frames exist.)

- [ ] **Step 4: Commit**

```bash
git add src/sequence/ScrollSequence.tsx src/App.tsx
git commit -m "feat: ScrollSequence player + app wiring"
```

---

### Task 7: Procedural placeholder frame generator

**Files:**
- Create: `scripts/generate-placeholders.mjs`
- Generates: `public/cottage/frames/0001.png …`, `public/cottage/manifest.json`, and the same under `public/cottage/mobile/`

**Interfaces:**
- Produces: PNG frames + manifests conforming to the frame contract (ext `"png"`).

- [ ] **Step 1: Write the generator**

`scripts/generate-placeholders.mjs`:
```js
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
```

- [ ] **Step 2: Run it**

Run: `npm run gen:placeholders`
Expected: logs "wrote 120 frames to public/cottage" and "...mobile"; files exist:
`ls public/cottage/frames | head -2` → `0001.png` `0002.png`; `cat public/cottage/manifest.json` shows `"frameCount":120`.

- [ ] **Step 3: Ignore generated frames in git**

Append to `.gitignore`:
```
public/cottage/frames/
public/cottage/mobile/frames/
```
(Keep the manifests; frames are regenerated via `npm run gen:placeholders` and later replaced by real footage.)

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-placeholders.mjs .gitignore public/cottage/manifest.json public/cottage/mobile/manifest.json
git commit -m "feat: procedural placeholder frame generator"
```

---

### Task 8: Integration verification (headless browser)

**Files:**
- Create: `scripts/verify.mjs`

**Interfaces:**
- Consumes: a running `npm run dev` server and generated placeholder frames.
- Produces: pass/fail console output + screenshots in `verify-out/`.

- [ ] **Step 1: Write the verification script**

`scripts/verify.mjs`:
```js
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
```

- [ ] **Step 2: Run the verification**

Run (two shells):
```bash
npm run dev          # shell 1
npm run verify       # shell 2
```
Expected: `VERIFY PASSED`, `errors: 0`, `nonBlank: true`, `frames change on scroll: true`. Inspect `verify-out/{start,mid,end}.png` — visibly different journey frames (grey → glowing).

- [ ] **Step 3: Commit**

```bash
echo "verify-out/" >> .gitignore
git add scripts/verify.mjs .gitignore
git commit -m "test: headless scroll-scrub integration verification"
```

---

### Task 9: AI-video production kit (deliverable docs)

**Files:**
- Create: `production/SHOTLIST.md`, `scripts/extract-frames.sh`

**Interfaces:**
- Produces: the human workflow to generate footage in Higgsfield/Seedance and extract it into the frame contract.

- [ ] **Step 1: Write the ffmpeg extraction script**

`scripts/extract-frames.sh`:
```bash
#!/usr/bin/env bash
# Usage: scripts/extract-frames.sh path/to/journey.mp4 [frameCount] [width] [height]
set -euo pipefail
SRC="${1:?usage: extract-frames.sh <video> [frames] [w] [h]}"
N="${2:-180}"; W="${3:-1600}"; H="${4:-900}"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
FPS=$(python3 -c "print(${N}/${DUR})")

emit () { # dir width height
  local dir="$1" w="$2" h="$3"
  mkdir -p "$dir/frames"
  ffmpeg -y -i "$SRC" -vf "fps=${FPS},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" \
    -vframes "$N" -c:v libwebp -q:v 80 "$dir/frames/%04d.webp"
  printf '{"frameCount":%d,"width":%d,"height":%d,"ext":"webp","fps":30}\n' "$N" "$w" "$h" > "$dir/manifest.json"
  echo "wrote $N frames -> $dir"
}

emit public/cottage "$W" "$H"
emit public/cottage/mobile "$((W/2))" "$((H/2))"
```
Then: `chmod +x scripts/extract-frames.sh`

- [ ] **Step 2: Write the shot list / prompt guide**

`production/SHOTLIST.md`:
```markdown
# Into the Woods — Footage Production (Higgsfield / Seedance)

Goal: one continuous, photoreal forward-travel through a misty forest to a cottage,
evolving **mundane → magical**. Produced as image-to-video, chained, then stitched.

## Workflow
1. **Keyframe stills (image model: Gemini/Imagen, Midjourney, or Flux).** Generate a still
   per beat to lock the look:
   - A: "photorealistic misty grey dawn forest, dirt path receding into fog, muted, cinematic, 16:9"
   - B: "same forest, late golden light breaking through fog, faint glow, drifting pollen, 16:9"
   - C: "same forest clearing at dusk, a small stone cottage with warm glowing windows, glowing
     mushrooms, fireflies, magical, volumetric light, photorealistic, 16:9"
   Keep style/seed consistent so A→B→C feel like one place.
2. **Image-to-video in Higgsfield (Seedance engine).** For each segment use **start frame +
   end frame** (A→B, then B→C). Camera move preset: **slow forward dolly / push-in**. Prompt the
   motion, e.g. "slow steady forward dolly down the path, gentle, cinematic, no cuts".
3. **Chain for length/continuity.** If a segment is too short, take its **last frame** and use it
   as the **start frame** of the next generation to extend the travel.
4. **Stitch** the ordered clips into one `journey.mp4` (any editor, or
   `ffmpeg -f concat`). Target ≥ 8s, 1600×900+.

## Hand-off to the app
Run: `scripts/extract-frames.sh journey.mp4 180 1600 900`
This writes `public/cottage/frames/####.webp` + `manifest.json` (and the mobile set).
Reload the app — the player picks it up automatically. No code changes.

## Tips
- Keep camera motion monotonic (always forward) so scroll = travel feels natural.
- Bake the magical ramp across B→C, not in one clip.
- More frames (180–240) = smoother scrub; fewer = lighter download.
```

- [ ] **Step 3: Commit**

```bash
git add production/SHOTLIST.md scripts/extract-frames.sh
git commit -m "docs: AI-video production kit (shot list + ffmpeg extraction)"
```

---

## Self-Review

- **Spec coverage:** player units (§4a) → Tasks 2–6; frame contract (§4c) → Tasks 3,7,9; placeholder validation (§5) → Task 7; perf/fallbacks (§6) → Task 6 (reduce/mobile) + Task 7 (mobile set); verification (§7) → Task 8; production kit (§4b) → Task 9. Stack simplification (no R3F) noted in header.
- **Placeholder scan:** no TBD/TODO; every code step contains complete code.
- **Type consistency:** `FrameManifest`, `Sequence`, `progressToIndex`/`damp`/`coverRect`, `frameUrl`, `updateOverlayOpacity` names/signatures match across Tasks 2–6.
- **Gap check:** reduced-motion (Task 6 draw loop), mobile selection (Task 6 App), error state (Preloader) all covered.
