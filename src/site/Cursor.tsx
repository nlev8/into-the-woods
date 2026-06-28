import { useEffect, useRef } from "react";

/** A soft firefly glow that lags behind the cursor (desktop only). The native
 *  cursor stays visible; this is an additive aura, not a replacement. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const el = ref.current;
    if (!el) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let x = mx;
    let y = my;
    let hover = false;
    let raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target as HTMLElement | null;
      hover = !!t?.closest("a, button, input, [role=button]");
    };
    const loop = () => {
      x += (mx - x) * 0.16;
      y += (my - y) * 0.16;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${hover ? 2.3 : 1})`;
      el.style.opacity = hover ? "0.9" : "0.55";
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed", left: 0, top: 0, zIndex: 70, pointerEvents: "none",
        width: 12, height: 12, borderRadius: "50%",
        background: "radial-gradient(circle, #ffe9a8 0%, #e6b27a 55%, transparent 75%)",
        boxShadow: "0 0 16px 5px rgba(230,178,122,0.55)",
        mixBlendMode: "screen",
        transition: "opacity .25s",
      }}
    />
  );
}
