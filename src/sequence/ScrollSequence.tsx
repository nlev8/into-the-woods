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
