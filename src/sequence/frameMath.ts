export function progressToIndex(progress: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  const p = Math.min(Math.max(progress, 0), 1);
  return Math.min(frameCount - 1, Math.round(p * (frameCount - 1)));
}

// Frame-rate-independent exponential approach toward target.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export interface CoverRect { dx: number; dy: number; dw: number; dh: number }

export function coverRect(cw: number, ch: number, iw: number, ih: number): CoverRect {
  if (iw <= 0 || ih <= 0) return { dx: 0, dy: 0, dw: cw, dh: ch };
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { dx: (cw - dw) / 2, dy: (ch - dh) / 2, dw, dh };
}
