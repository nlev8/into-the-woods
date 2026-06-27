import { describe, it, expect } from "vitest";
import { progressToIndex, damp, coverRect } from "./frameMath";

describe("progressToIndex", () => {
  it("maps endpoints", () => {
    expect(progressToIndex(0, 180)).toBe(0);
    expect(progressToIndex(1, 180)).toBe(179);
  });
  it("clamps out-of-range", () => {
    expect(progressToIndex(-0.5, 180)).toBe(0);
    expect(progressToIndex(2, 180)).toBe(179);
  });
  it("handles empty", () => {
    expect(progressToIndex(0.5, 0)).toBe(0);
  });
});

describe("damp", () => {
  it("moves toward target and converges", () => {
    expect(damp(0, 10, 8, 1)).toBeGreaterThan(0);
    expect(damp(0, 10, 8, 1)).toBeLessThan(10);
    let v = 0;
    for (let i = 0; i < 100; i++) v = damp(v, 10, 8, 0.05);
    expect(v).toBeCloseTo(10, 1);
  });
});

describe("coverRect", () => {
  it("fills and centers a wide image in a tall canvas", () => {
    const r = coverRect(100, 200, 200, 100); // image very wide
    expect(r.dw).toBeGreaterThanOrEqual(100);
    expect(r.dh).toBeGreaterThanOrEqual(200);
    expect(r.dx).toBeLessThanOrEqual(0);
  });
});
