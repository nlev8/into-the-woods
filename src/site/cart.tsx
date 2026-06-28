import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Product = { name: string; price: number; img: string };
type Item = Product & { qty: number };

type CartValue = {
  items: Item[];
  open: boolean;
  count: number;
  subtotal: number;
  add: (p: Product) => void;
  remove: (name: string) => void;
  setOpen: (o: boolean) => void;
};

const Ctx = createContext<CartValue | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const add = useCallback((p: Product) => {
    setItems((cur) => {
      const existing = cur.find((i) => i.name === p.name);
      if (existing) return cur.map((i) => (i.name === p.name ? { ...i, qty: i.qty + 1 } : i));
      return [...cur, { ...p, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((name: string) => {
    setItems((cur) => cur.filter((i) => i.name !== name));
  }, []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  const value = useMemo(
    () => ({ items, open, count, subtotal, add, remove, setOpen }),
    [items, open, count, subtotal, add, remove]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <CartDrawer />
    </Ctx.Provider>
  );
}

function CartDrawer() {
  const { items, remove, open, setOpen, subtotal, count } = useCart();
  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .3s" }}
      />
      <aside
        aria-label="Basket"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 81, width: "min(400px, 90vw)",
          background: "var(--bg2)", borderLeft: "1px solid var(--line2)",
          transform: open ? "none" : "translateX(100%)", transition: "transform .35s cubic-bezier(.22,1,.36,1)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", borderBottom: "1px solid var(--line2)" }}>
          <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22 }}>Your basket ({count})</h3>
          <button onClick={() => setOpen(false)} aria-label="Close basket" style={{ background: "none", border: "none", color: "var(--cream)", fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px" }}>
          {items.length === 0 && <p style={{ color: "var(--dim)", marginTop: 36, textAlign: "center" }}>Your basket is empty.</p>}
          {items.map((i) => (
            <div key={i.name} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--line2)" }}>
              <img src={i.img} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 17 }}>{i.name}</div>
                <div style={{ color: "var(--dim)", fontSize: 13, marginTop: 2 }}>Qty {i.qty} · ${i.price}</div>
              </div>
              <button onClick={() => remove(i.name)} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 13, textDecoration: "underline" }}>Remove</button>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--line2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, marginBottom: 16 }}>
            <span>Subtotal</span>
            <span style={{ color: "var(--amber2)" }}>${subtotal}</span>
          </div>
          <button disabled={!items.length} style={{ width: "100%", padding: 14, borderRadius: 999, background: "var(--amber)", color: "#1c1408", border: "none", fontWeight: 600, fontSize: 15, opacity: items.length ? 1 : 0.5 }}>
            Checkout
          </button>
          <p style={{ textAlign: "center", color: "var(--dim)", fontSize: 12, marginTop: 12 }}>Free shipping over $50 · Hand-poured to order</p>
        </div>
      </aside>
    </>
  );
}
