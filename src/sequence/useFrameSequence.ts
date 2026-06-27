import { useEffect, useState } from "react";
import { FrameManifest, loadManifest, frameUrl } from "./manifest";

export interface Sequence {
  manifest: FrameManifest | null;
  images: HTMLImageElement[];
  progress: number;
  ready: boolean;
  error: string | null;
}

const INITIAL: Sequence = { manifest: null, images: [], progress: 0, ready: false, error: null };

export function useFrameSequence(base: string): Sequence {
  const [state, setState] = useState<Sequence>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    setState(INITIAL);

    (async () => {
      try {
        const manifest = await loadManifest(`${base}/manifest.json`);
        const images: HTMLImageElement[] = new Array(manifest.frameCount);
        let loaded = 0;

        await Promise.all(
          Array.from({ length: manifest.frameCount }, (_, i) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.decoding = "async";
              const done = () => {
                images[i] = img;
                loaded += 1;
                if (!cancelled) setState((s) => ({ ...s, manifest, progress: loaded / manifest.frameCount }));
                resolve();
              };
              img.onload = done;
              img.onerror = done; // keep the index; draw-loop skips broken images
              img.src = frameUrl(base, i, manifest.ext);
            })
          )
        );

        if (!cancelled) setState({ manifest, images, progress: 1, ready: true, error: null });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, error: (e as Error).message }));
      }
    })();

    return () => { cancelled = true; };
  }, [base]);

  return state;
}
