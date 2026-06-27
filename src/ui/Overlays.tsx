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
