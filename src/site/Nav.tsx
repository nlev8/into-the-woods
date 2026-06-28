export function Nav() {
  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px clamp(20px,4vw,40px)",
        background: "linear-gradient(to bottom, rgba(8,12,9,0.65), transparent)",
      }}
    >
      <a
        href="#top"
        style={{ fontFamily: "var(--serif)", fontSize: "clamp(20px,2.4vw,26px)", textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 2px 22px rgba(0,0,0,0.6)" }}
      >
        Mossbloom
      </a>
      <nav style={{ display: "flex", alignItems: "center", gap: "clamp(14px,2vw,26px)", fontFamily: "var(--sans)", fontSize: 14 }}>
        <a href="#shop" style={{ opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 2px 18px rgba(0,0,0,0.6)" }}>Shop</a>
        <a href="#story" style={{ opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 2px 18px rgba(0,0,0,0.6)" }}>Our story</a>
        <a
          href="#shop"
          style={{ padding: "9px 18px", borderRadius: 999, border: "1px solid rgba(230,178,122,0.6)", color: "var(--amber2)", backdropFilter: "blur(4px)" }}
        >
          Shop the collection
        </a>
      </nav>
    </header>
  );
}
