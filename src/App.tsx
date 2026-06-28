import { useMemo } from "react";
import { ScrollSequence } from "./sequence/ScrollSequence";
import { Nav } from "./site/Nav";
import { Sections } from "./site/Sections";
import { CartProvider } from "./site/cart";
import { Grain } from "./site/Grain";
import { Cursor } from "./site/Cursor";

export default function App() {
  const base = useMemo(() => {
    if (typeof window === "undefined") return "/cottage";
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return mobile ? "/cottage/mobile" : "/cottage";
  }, []);

  return (
    <CartProvider>
      <Grain />
      <Cursor />
      <Nav />
      <div id="top">
        <ScrollSequence base={base} pages={6} />
      </div>
      <Sections />
    </CartProvider>
  );
}
