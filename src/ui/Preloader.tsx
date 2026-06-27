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
