import { useMemo } from "react";
import { ScrollSequence } from "./sequence/ScrollSequence";

export default function App() {
  const base = useMemo(() => {
    if (typeof window === "undefined") return "/cottage";
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return mobile ? "/cottage/mobile" : "/cottage";
  }, []);
  return <ScrollSequence base={base} />;
}
