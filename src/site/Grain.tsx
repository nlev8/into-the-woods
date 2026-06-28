/** Subtle film-grain overlay for a tactile, cinematic finish. */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", opacity: 0.05, mixBlendMode: "overlay" }}
    >
      <svg style={{ width: "100%", height: "100%" }}>
        <filter id="moss-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#moss-grain)" />
      </svg>
    </div>
  );
}
