import { forwardRef } from "react";

const beat: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, textAlign: "center",
  color: "var(--cream)", pointerEvents: "none", padding: "0 24px",
  textShadow: "0 2px 5px rgba(0,0,0,0.55), 0 6px 44px rgba(0,0,0,0.78)",
};

export const Overlays = forwardRef<HTMLDivElement>(function Overlays(_props, ref) {
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
      {/* legibility scrim — darkens the misty background behind the text */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 82% 56% at 50% 33%, rgba(8,11,8,0.62) 0%, rgba(8,11,8,0.24) 45%, transparent 66%), linear-gradient(to bottom, rgba(8,11,8,0.55), transparent 16%)" }} />
      <div data-beat="intro" style={{ ...beat, top: "27vh" }}>
        <p style={{ fontFamily: "var(--sans)", fontSize: 12, letterSpacing: "0.42em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.9 }}>Mossbloom</p>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(2.4rem,6.4vw,5rem)", lineHeight: 1.04, marginTop: 16 }}>Bring the woods home.</h1>
        <p style={{ marginTop: 18, fontSize: "clamp(1rem,1.7vw,1.2rem)", opacity: 0.95, lineHeight: 1.5 }}>
          Hand-poured candles &amp; botanical goods,<br />scented like the walk home through the trees.
        </p>
        <p style={{ marginTop: 38, fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.5 }}>scroll to wander in</p>
      </div>

      <div data-beat="mid" style={{ ...beat, top: "44vh", opacity: 0 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.6rem,3.6vw,2.7rem)" }}>Hand-poured. Slow-made.</h2>
      </div>

      <div data-beat="arrive" style={{ ...beat, top: "36vh", opacity: 0 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(2.2rem,5.4vw,3.8rem)" }}>Step inside.</h2>
        <a
          data-cta
          href="#shop"
          style={{
            pointerEvents: "none", display: "inline-block", marginTop: 26,
            padding: "15px 32px", borderRadius: 999, background: "var(--amber)",
            color: "#1c1408", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15,
            boxShadow: "0 10px 40px rgba(230,178,122,0.3)",
          }}
        >
          Shop the collection
        </a>
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
  const set = (beatName: string, value: number) => {
    const el = root.querySelector<HTMLElement>(`[data-beat="${beatName}"]`);
    if (el) el.style.opacity = String(value);
  };
  set("intro", clamp01(1 - progress * 7));
  set("mid", smoothstep(0.4, 0.5, progress) * (1 - smoothstep(0.62, 0.72, progress)));

  const arriveV = smoothstep(0.8, 0.95, progress);
  set("arrive", arriveV);
  const cta = root.querySelector<HTMLElement>("[data-cta]");
  if (cta) cta.style.pointerEvents = arriveV > 0.6 ? "auto" : "none";
}
