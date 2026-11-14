"use client";

import meta from "./frames.json";
import { asset } from "./asset";

/**
 * The hero sequence is two clips played back to back on one canvas:
 * the real "sky" sunset, then the "pixel" synthwave world. Frames are
 * addressed by one global index: 0..SKY_COUNT-1 are sky, the rest are pixel.
 */
const SEGMENTS = meta.segments as { id: string; count: number }[];

export const SKY_COUNT = SEGMENTS[0].count;
export const FRAME_COUNT: number = SEGMENTS.reduce((n, s) => n + s.count, 0);
/** cache-buster: frames are served immutable, so a regenerate must change the URL */
export const FRAME_VERSION: string = meta.v;

export type FrameSet = "desktop" | "mobile";

export const frameSrc = (i: number, set: FrameSet) => {
  let local = i;
  for (const seg of SEGMENTS) {
    if (local < seg.count) {
      return asset(`/frames/${set}/${seg.id}/f_${String(local + 1).padStart(4, "0")}.webp?v=${FRAME_VERSION}`);
    }
    local -= seg.count;
  }
  throw new Error(`frame ${i} out of range`);
};

/**
 * Loads the image sequence in a coarse-to-fine order (every 8th, then 4th, 2nd, rest)
 * so the scrub is usable almost immediately and sharpens as the rest streams in.
 * `onCritical` reports progress of the first (every-8th) pass, which gates the preloader.
 */
export function loadFrames(
  set: FrameSet,
  onCritical: (p: number) => void,
): (HTMLImageElement | null)[] {
  const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  // the first frame and the frames either side of the sky→pixel cut matter most
  [0, SKY_COUNT - 1, SKY_COUNT, FRAME_COUNT - 1].forEach(push);
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < FRAME_COUNT; i += step) push(i);
  }

  const isCritical = (i: number) => i % 8 === 0 || i === SKY_COUNT - 1 || i === SKY_COUNT || i === FRAME_COUNT - 1;
  const criticalTotal = order.filter(isCritical).length;
  let criticalDone = 0;
  let cursor = 0;
  const CONCURRENCY = 6;

  const next = () => {
    if (cursor >= order.length) return;
    const idx = order[cursor++];
    const img = new Image();
    img.decoding = "async";
    const done = () => {
      if (img.naturalWidth) images[idx] = img;
      if (isCritical(idx)) {
        criticalDone++;
        onCritical(criticalDone / criticalTotal);
      }
      next();
    };
    img.onload = done;
    img.onerror = done;
    img.src = frameSrc(idx, set);
  };
  for (let c = 0; c < CONCURRENCY; c++) next();
  return images;
}

/**
 * Nearest loaded frame to `i`, never crossing the sky/pixel boundary
 * (a stray frame from the other clip would flash).
 */
export function nearestFrame(images: (HTMLImageElement | null)[], i: number) {
  if (images[i]) return images[i];
  const lo = i < SKY_COUNT ? 0 : SKY_COUNT;
  const hi = i < SKY_COUNT ? SKY_COUNT - 1 : images.length - 1;
  for (let d = 1; d <= hi - lo; d++) {
    if (i - d >= lo && images[i - d]) return images[i - d];
    if (i + d <= hi && images[i + d]) return images[i + d];
  }
  return null;
}
