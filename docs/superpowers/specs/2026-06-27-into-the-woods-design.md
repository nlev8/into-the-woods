# Into the Woods — Photoreal Scroll-Scrub Journey

- **Date:** 2026-06-27
- **Status:** Approved design, pending spec review
- **Project:** `into-the-woods` (standalone; unrelated to Opticlaw)

## 1. Concept

A single-page, full-viewport experience: as the user scrolls, they travel through a
foggy forest that **evolves from mundane → magical**, arriving at a glowing cottage.
The visuals are a **pre-rendered, path-traced (Blender Cycles) flythrough** scrubbed
frame-by-frame to scroll progress. The magical evolution (fog lifting, glowing
mushrooms, fae lights/fireflies, lit cottage windows) is **baked into the render**.

The pixels are produced offline for maximum photorealism; the web app is a precise
**scroll-driven frame player** plus synced text overlays.

## 2. Goals / Non-Goals

**Goals**
- A buttery, frame-accurate scroll-scrub player for a photoreal image sequence.
- Mundane→magical narrative conveyed by the baked render + 2–3 synced text beats.
- Fully working and verifiable **today** using placeholder frames; the real render
  drops in later with zero code changes.
- A Blender scaffold (script + guide) so the photoreal render can be produced.

**Non-Goals (YAGNI)**
- No interactivity / free-roam camera (inherent cost of pre-rendering — accepted).
- No backend, auth, SSR, CMS, or analytics.
- No real-time 3D lighting of the hero scene (the low-poly R3F scene exists **only**
  to generate placeholder frames, not as the final look).
- We do **not** produce the photoreal render in code — that is an external Blender task.

## 3. Stack

- **Vite + React + TypeScript** (pure client-side, static deploy).
- **@react-three/fiber + three** — only for the placeholder-frame generator scene.
- **lenis** — smooth scroll feeding the scrub.
- No drei/postprocessing required for the player itself (the look is in the render).

## 4. Architecture

Two decoupled halves joined by a **frame contract**:

```
[ Blender Cycles render ]  --frames + manifest-->  [ Web ScrollSequence player ]
   (external, you/artist)        (the contract)         (this repo, I build)
```

### 4a. Web player (this repo, built now)

Units, each with one responsibility:

1. **`useFrameSequence(manifest)`** — loads `manifest.json`, preloads all frame images
   (decoded to `ImageBitmap`/`HTMLImageElement`), exposes `{ images, progress, ready }`.
   Responsibility: asset loading + decode only.
2. **`ScrollSequence`** — owns the tall scroll container + `sticky` full-viewport
   `<canvas>`. Maps scroll `0→1` to an **eased** frame index and draws that frame
   `cover`-fit each `rAF`. Responsibility: scroll→frame→draw only.
3. **`Preloader`** — full-screen overlay with a progress bar driven by
   `useFrameSequence().progress`; fades out on `ready`. Responsibility: loading UX.
4. **`Overlays`** — absolutely-positioned HTML text beats (intro / midpoint / arrival)
   whose opacity is set **directly via DOM** from the scroll value (no React re-render).
   Responsibility: narrative text sync.
5. **`App`** — composes the above; reads which sequence (desktop vs mobile) to use.

**Data flow (per frame):** `scroll position → progress(0..1) → easedIndex →
images[index] → ctx.drawImage(cover-fit)`. Overlay opacities computed from the same
`progress` in the scroll handler.

### 4b. Blender scaffold (this repo as deliverable; runs externally)

- **`blender/render_flythrough.py`** — Blender Python:
  - Camera constrained to an animated path curve, `frame 1..N`.
  - Cycles + denoise; output `frames/####.webp` at the contract resolution.
  - **Baked evolution:** keyframe fog/volume density, key-light energy/color, emission
    strength of mushrooms + cottage windows, and firefly particle count across the
    timeline (mundane at frame 1 → magical at frame N).
  - Writes/refreshes `manifest.json`.
- **`blender/README.md`** — production guide: photoreal asset sources (Poly Haven,
  Quixel Megascans via Fab, BlenderKit — explicitly not low-poly packs), how to run the
  script, the evolution recipe, and the handoff (copy `frames/` + `manifest.json` into
  `public/cottage/`).

### 4c. Frame contract (decouples the halves)

- **Location:** `public/cottage/frames/0001.webp …` and `public/cottage/manifest.json`.
- **`manifest.json` schema:**
  ```json
  { "frameCount": 180, "width": 1600, "height": 900, "ext": "webp", "fps": 30 }
  ```
- **Defaults:** ~180 frames; 1600×900 desktop, 800×450 mobile (`public/cottage/mobile/`).
- The player reads only the manifest — re-render anytime; nothing in code changes.

## 5. Placeholder frames (build-now validation)

A dev-only script captures the existing low-poly forest scene (ported from the Opticlaw
prototype) at N scroll steps via headless browser → writes `public/cottage/frames/####.webp`
+ `manifest.json`. This proves scrubbing, easing, preloader, overlays, and perf
end-to-end before any Blender render exists.

## 6. Performance & fallbacks

- **Preload-then-play:** all frames decoded behind the `Preloader` (a few-second wait
  with a progress bar is acceptable for a showcase). ~180 WebP ≈ 20–40 MB desktop.
- **Mobile:** load the lighter `mobile/` sequence (≈800×450). Detected by viewport/coarse pointer.
- **`prefers-reduced-motion`:** skip scrubbing; show a single representative key frame.
- **Resize:** recompute cover-fit; redraw current frame.

## 7. Verification

- Headless browser drives scroll to several positions; asserts the drawn frame index
  matches expected and the canvas is non-blank; screenshots start/mid/arrival.
- Confirms preloader → reveal, overlay opacity transitions, and reduced-motion fallback.

## 8. Risks / tradeoffs

- **Asset weight** vs. quality — mitigated by WebP, preloader, mobile set, tunable
  frame count/resolution.
- **Fixed path** — accepted; it is the price of max photorealism.
- **The look depends entirely on the external render** — the web player is
  render-agnostic; we validate mechanics with placeholders.
- **Video alternative** (single file, `currentTime` scrub) was rejected: jank/seek
  unreliability on iOS Safari. Image sequence chosen for frame accuracy.

## 9. Out of scope

Interactivity, audio, multiple scenes/routes, CMS, deploy automation (manual static
deploy is fine), and producing the photoreal render itself.
