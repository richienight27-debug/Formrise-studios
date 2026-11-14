// Builds the hero image sequence from two clips:
//   1. "sky"   — scripts/sky.mp4: real sunset with volumetric clouds
//   2. "pixel" — scripts/source.mp4 from PIXEL_START onward: the 8-bit synthwave world
// The hero canvas plays sky → (live pixelation transition) → pixel as you scroll.
// Frames are served with an immutable cache header, so `v` (written to frames.json) busts caches on regenerate.
// Usage: npm run frames
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const segments = [
  {
    id: "sky",
    src: "scripts/sky.mp4",
    // centred 16:9 crop that cuts off the generator watermark (x >= 1138 in the 1280x720 source)
    crop: "crop=990:556:145:82",
    fps: 12,
    start: 0,
    widths: { desktop: 1280, mobile: 800 },
  },
  {
    id: "pixel",
    src: "scripts/source.mp4",
    // centred 16:9 crop that cuts off the watermark (x >= 1700 in the 1920x1080 source)
    crop: "crop=1480:832:220:124",
    fps: 14,
    start: 4.0, // the real-landscape opening of this clip is dropped; start once it's fully pixel art
    widths: { desktop: 1600, mobile: 900 },
  },
];
const QUALITY = { desktop: 72, mobile: 68 };

rmSync("public/frames", { recursive: true, force: true });
const meta = { v: Date.now().toString(36), segments: [] };

for (const seg of segments) {
  for (const [set, width] of Object.entries(seg.widths)) {
    const out = `public/frames/${set}/${seg.id}`;
    mkdirSync(out, { recursive: true });
    execFileSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(seg.start), "-i", seg.src,
      "-vf", `${seg.crop},fps=${seg.fps},scale=${width}:-2:flags=lanczos`,
      "-c:v", "libwebp", "-quality", String(QUALITY[set]), "-compression_level", "5",
      `${out}/f_%04d.webp`,
    ], { stdio: "inherit" });
  }
  const count = readdirSync(`public/frames/desktop/${seg.id}`).length;
  const mobileCount = readdirSync(`public/frames/mobile/${seg.id}`).length;
  if (count !== mobileCount) throw new Error(`${seg.id}: desktop/mobile frame counts differ`);
  meta.segments.push({ id: seg.id, count });
  console.log(`${seg.id}: ${count} frames`);
}
writeFileSync("src/lib/frames.json", JSON.stringify(meta, null, 2));

// Poster = first sky frame (instant paint before JS); pixel-end = final pixel frame
execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", segments[0].src,
  "-vframes", "1", "-vf", `${segments[0].crop},scale=1280:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "80", "public/images/poster.webp"]);
execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-sseof", "-0.1", "-i", segments[1].src,
  "-vframes", "1", "-vf", `${segments[1].crop},scale=1600:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "80", "public/images/pixel-end.webp"]);
console.log("done");
