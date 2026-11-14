# Formrise Studios

Agency site built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Where things live

| What | Where |
| --- | --- |
| All copy (services, process, founder bio, contact email, socials) | `src/content/site.ts` |
| Placeholder projects | `projects` in `src/content/site.ts` (search for `PLACEHOLDER`) |
| Founder photo | `public/images/founder.webp` |
| Colours & fonts | `src/app/globals.css` (`@theme`) and `src/app/layout.tsx` |

## Hero video

The hero isn't a `<video>` tag. Two clips are split into WebP frames and drawn on a `<canvas>`
as you scroll, which keeps scrubbing smooth in every browser:

1. `scripts/sky.mp4`: real sunset with volumetric clouds (120 frames)
2. `scripts/source.mp4` from 4s onward: the 8-bit synthwave world (84 frames)

Between them the canvas pixelates the sky, cuts at the blockiest point, and de-pixelates
into the pixel world (`TRANSITION_FRAMES` / `MAX_BLOCK` in `src/components/Hero.tsx`).

To swap either clip, replace the file and run `npm run frames` (uses the bundled `ffmpeg-static`).
Each clip has a centred crop in `scripts/extract-frames.mjs` that removes the generator watermark
from the bottom-right corner; adjust it for a different clip. Frames are cached as immutable, so each
run writes a new version tag into `src/lib/frames.json` to bust caches.

## Typography

- **Archivo** (variable weight + width): headlines; the preloader wordmark animates both axes toward the pointer
- **Fraunces** italic: accent words
- **Manrope**: body copy and small labels

## Motion stack

- **GSAP + ScrollTrigger**: hero scroll sequence, pinned horizontal work gallery, stacked process cards, text reveals
- **Lenis**: smooth scrolling, synced to the GSAP ticker
- **Motion** (`motion/react`): the Dynamic Island nav's spring layout morphs, magnetic button
- **WebGL shader** (`GradientBackground.tsx`): the flowing sunset gradient behind dark sections; bends toward the pointer, ripples on click
- Honors `prefers-reduced-motion`
