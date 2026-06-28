import { Reveal } from "./Reveal";
import { useCart, type Product } from "./cart";

type CandleProduct = Product & { notes: string };

const products: CandleProduct[] = [
  { name: "Mossgrove", notes: "Damp moss · cedar · cool rain", price: 34, img: "/cottage/products/mossgrove.png" },
  { name: "Hollow Pine", notes: "Pine resin · woodsmoke · fir", price: 34, img: "/cottage/products/hollowpine.png" },
  { name: "Ember & Fern", notes: "Amber · fern · warm hearth", price: 36, img: "/cottage/products/emberfern.png" },
  { name: "Wild Birch", notes: "Birch bark · vetiver · mist", price: 32, img: "/cottage/products/wildbirch.png" },
];

const reviews = [
  { q: "It smells exactly like the trail behind my grandmother's house. I'm on my third Mossgrove.", n: "Lena R." },
  { q: "Burns clean for hours and the throw fills the whole room. Hollow Pine is unreal.", n: "Marcus T." },
  { q: "The packaging alone made me a little emotional. Everything feels made with care.", n: "Priya S." },
];

function Candle({ p }: { p: CandleProduct }) {
  const { add } = useCart();
  return (
    <div className="candle-card" style={{ background: "var(--card)", border: "1px solid var(--line2)", borderRadius: 16, padding: 16 }}>
      <div style={{ position: "relative", height: 240, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line2)" }}>
        <img src={p.img} alt={`${p.name} candle`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
        <h3 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22 }}>{p.name}</h3>
        <span style={{ color: "var(--amber2)", fontSize: 16 }}>${p.price}</span>
      </div>
      <p style={{ color: "var(--dim)", fontSize: 13, marginTop: 6 }}>{p.notes}</p>
      <button
        onClick={() => add({ name: p.name, price: p.price, img: p.img })}
        style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 999, background: "transparent", border: "1px solid var(--line2)", color: "var(--cream)", fontSize: 14, transition: "all .2s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--amber)"; e.currentTarget.style.color = "#1c1408"; e.currentTarget.style.borderColor = "var(--amber)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--cream)"; e.currentTarget.style.borderColor = "var(--line2)"; }}
      >
        Add to cart
      </button>
    </div>
  );
}

export function Sections() {
  return (
    <main style={{ position: "relative", zIndex: 2, background: "var(--bg)" }}>
      <section id="shop" style={{ padding: "clamp(80px,12vh,140px) clamp(20px,5vw,40px)", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <p style={{ textAlign: "center", color: "var(--amber)", fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase" }}>The Collection</p>
          <h2 style={{ textAlign: "center", fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(2rem,4.4vw,3.2rem)", marginTop: 14 }}>Light a little of the forest.</h2>
          <p style={{ textAlign: "center", color: "var(--dim)", marginTop: 14, maxWidth: 540, marginInline: "auto", lineHeight: 1.6 }}>Soy wax, cotton wicks, and botanical oils — hand-poured in small batches at the edge of the woods.</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 22, marginTop: 56 }}>
          {products.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.07}>
              <Candle p={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="story" style={{ position: "relative", padding: "clamp(110px,18vh,200px) 24px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/cottage/frames/0150.webp)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,19,16,0.78), rgba(13,19,16,0.6))" }} />
        <Reveal style={{ position: "relative", maxWidth: 620, margin: "0 auto" }}>
          <p style={{ color: "var(--amber)", fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase" }}>Our story</p>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(1.8rem,4vw,2.8rem)", marginTop: 16, lineHeight: 1.2 }}>Made in a cabin at the edge of an old-growth forest.</h2>
          <p style={{ marginTop: 20, fontSize: "clamp(1rem,1.6vw,1.15rem)", color: "rgba(236,230,218,0.85)", lineHeight: 1.7 }}>
            Mossbloom started with one pour, one wick, and a window full of trees. Every candle is still made by hand in small batches — slow-set, double-scented, and poured to smell like the moment the path opens into the clearing and the cottage lights come on.
          </p>
        </Reveal>
      </section>

      <section style={{ padding: "clamp(80px,12vh,130px) clamp(20px,5vw,40px)", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>Loved by homebodies.</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22, marginTop: 48 }}>
          {reviews.map((r, i) => (
            <Reveal key={r.n} delay={i * 0.08}>
              <div style={{ background: "var(--card)", border: "1px solid var(--line2)", borderRadius: 16, padding: 28 }}>
                <div style={{ color: "var(--amber)", letterSpacing: 2 }}>★★★★★</div>
                <p style={{ marginTop: 16, fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.5, fontWeight: 300 }}>&ldquo;{r.q}&rdquo;</p>
                <p style={{ marginTop: 18, color: "var(--dim)", fontSize: 13 }}>— {r.n}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={{ padding: "clamp(80px,12vh,130px) 24px", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(2rem,4.4vw,3.2rem)" }}>Bring the woods home.</h2>
          <p style={{ color: "var(--dim)", marginTop: 14 }}>Join for early drops, seasonal scents, and 10% off your first order.</p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 10, maxWidth: 440, margin: "28px auto 0", flexWrap: "wrap", justifyContent: "center" }}>
            <input placeholder="you@example.com" style={{ flex: "1 1 220px", padding: "14px 18px", borderRadius: 999, background: "var(--card)", border: "1px solid var(--line2)", color: "var(--cream)", fontSize: 15, outline: "none" }} />
            <button style={{ padding: "14px 26px", borderRadius: 999, background: "var(--amber)", color: "#1c1408", border: "none", fontWeight: 600, fontSize: 15 }}>Subscribe</button>
          </form>
        </Reveal>
      </section>

      <footer style={{ borderTop: "1px solid var(--line2)", padding: "48px clamp(20px,5vw,40px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 26, justifyContent: "space-between", alignItems: "center" }}>
          <a href="#top" style={{ fontFamily: "var(--serif)", fontSize: 24 }}>Mossbloom</a>
          <nav style={{ display: "flex", gap: 24, fontSize: 14, color: "var(--dim)", flexWrap: "wrap" }}>
            <a href="#shop">Shop</a><a href="#story">Our story</a><a href="#">Shipping</a><a href="#">Contact</a>
          </nav>
          <span style={{ fontSize: 12, color: "var(--dim)" }}>© 2026 Mossbloom</span>
        </div>
      </footer>
    </main>
  );
}
