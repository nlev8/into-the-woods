import { useState } from "react";
import { useCart } from "./cart";

const linkStyle: React.CSSProperties = {
  opacity: 0.92,
  textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 2px 18px rgba(0,0,0,0.6)",
};

function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Open basket, ${count} item${count === 1 ? "" : "s"}`}
      style={{ position: "relative", background: "none", border: "none", padding: 6, color: "var(--cream)", display: "flex", alignItems: "center" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--amber)", color: "#1c1408", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {count}
        </span>
      )}
    </button>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const bar = (i: number): React.CSSProperties => ({
    display: "block", width: 22, height: 2, borderRadius: 2, background: "var(--cream)",
    transition: "transform .25s ease, opacity .2s ease",
    transform: open ? (i === 0 ? "translateY(7px) rotate(45deg)" : i === 2 ? "translateY(-7px) rotate(-45deg)" : "none") : "none",
    opacity: open && i === 1 ? 0 : 1,
  });

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "linear-gradient(to bottom, rgba(8,12,9,0.65), transparent)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(20px,4vw,40px)" }}>
        <a href="#top" onClick={close} style={{ fontFamily: "var(--serif)", fontSize: "clamp(20px,2.4vw,26px)", textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 2px 22px rgba(0,0,0,0.6)" }}>
          Mossbloom
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px,1.5vw,18px)" }}>
          <nav className="nav-links" style={{ fontFamily: "var(--sans)", fontSize: 14 }}>
            <a href="#shop" style={linkStyle}>Shop</a>
            <a href="#story" style={linkStyle}>Our story</a>
            <a href="#shop" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "9px 18px", borderRadius: 999, border: "1px solid rgba(230,178,122,0.6)", color: "var(--amber2)", backdropFilter: "blur(4px)", whiteSpace: "nowrap" }}>
              Shop the collection
            </a>
          </nav>

          <CartButton />

          <button
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            style={{ flexDirection: "column", gap: 5, background: "none", border: "none", padding: 8 }}
          >
            <span style={bar(0)} />
            <span style={bar(1)} />
            <span style={bar(2)} />
          </button>
        </div>
      </div>

      <nav className={`nav-menu ${open ? "open" : ""}`} style={{ flexDirection: "column", gap: 2, padding: "6px 24px 22px", background: "rgba(10,14,10,0.94)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line2)" }}>
        <a href="#shop" onClick={close} style={{ padding: "13px 0", fontSize: 16, fontFamily: "var(--sans)" }}>Shop</a>
        <a href="#story" onClick={close} style={{ padding: "13px 0", fontSize: 16, fontFamily: "var(--sans)", borderTop: "1px solid var(--line2)" }}>Our story</a>
        <a href="#shop" onClick={close} style={{ marginTop: 12, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "var(--amber)", color: "#1c1408", fontWeight: 600, fontFamily: "var(--sans)" }}>
          Shop the collection
        </a>
      </nav>
    </header>
  );
}
