import { describe, it, expect } from "vitest";
import { parseManifest, frameUrl } from "./manifest";

describe("parseManifest", () => {
  it("accepts a valid manifest", () => {
    const m = parseManifest({ frameCount: 180, width: 1600, height: 900, ext: "webp", fps: 30 });
    expect(m.frameCount).toBe(180);
    expect(m.ext).toBe("webp");
  });
  it("defaults ext and fps", () => {
    const m = parseManifest({ frameCount: 10, width: 800, height: 450 });
    expect(m.ext).toBe("webp");
    expect(m.fps).toBe(30);
  });
  it("rejects bad frameCount", () => {
    expect(() => parseManifest({ frameCount: 0, width: 1, height: 1 })).toThrow();
  });
});

describe("frameUrl", () => {
  it("zero-pads to 4 and is 1-based", () => {
    expect(frameUrl("/cottage", 0, "png")).toBe("/cottage/frames/0001.png");
    expect(frameUrl("/cottage", 179, "webp")).toBe("/cottage/frames/0180.webp");
  });
});
