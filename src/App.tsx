import { useMemo } from "react";
import { ScrollSequence } from "./sequence/ScrollSequence";
import { Nav } from "./site/Nav";
import { Sections } from "./site/Sections";

export default function App() {
  const base = useMemo(() => {
    if (typeof window === "undefined") return "/cottage";
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return mobile ? "/cottage/mobile" : "/cottage";
  }, []);

  return (
    <>
      <Nav />
      <div id="top">
        <ScrollSequence base={base} pages={6} />
      </div>
      <Sections />
    </>
  );
}
