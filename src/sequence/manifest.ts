export interface FrameManifest {
  frameCount: number;
  width: number;
  height: number;
  ext: string;
  fps: number;
}

export function parseManifest(data: unknown): FrameManifest {
  const m = (data ?? {}) as Partial<FrameManifest>;
  if (typeof m.frameCount !== "number" || m.frameCount <= 0) throw new Error("manifest: frameCount must be > 0");
  if (typeof m.width !== "number" || typeof m.height !== "number") throw new Error("manifest: width/height required");
  return {
    frameCount: m.frameCount,
    width: m.width,
    height: m.height,
    ext: typeof m.ext === "string" ? m.ext : "webp",
    fps: typeof m.fps === "number" ? m.fps : 30,
  };
}

export function frameUrl(base: string, index: number, ext: string): string {
  const n = String(index + 1).padStart(4, "0");
  return `${base}/frames/${n}.${ext}`;
}

export async function loadManifest(url: string): Promise<FrameManifest> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
  return parseManifest(await res.json());
}
