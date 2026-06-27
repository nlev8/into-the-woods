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
