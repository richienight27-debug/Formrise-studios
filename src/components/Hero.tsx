"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FRAME_COUNT, FRAME_VERSION, SKY_COUNT, loadFrames, nearestFrame, type FrameSet } from "@/lib/frames";
import { store, useStore } from "@/lib/store";
import { asset } from "@/lib/asset";

gsap.registerPlugin(ScrollTrigger);

// Sky → pixel transition: how many frames either side of the cut get pixelated,
// the largest block size (as a fraction of canvas width) and how many visible steps.
const TRANSITION_FRAMES = 14;
const MAX_BLOCK = 1 / 26;
const BLOCK_STEPS = 7;

const coverRect = (img: HTMLImageElement, w: number, h: number) => {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return [(w - dw) / 2, (h - dh) / 2, dw, dh] as const;
};

/**
 * Pinned scroll sequence drawn frame-by-frame on a canvas, scrubbed by scroll:
 * a real sunset over volumetric clouds that pixelates, cuts, and de-pixelates
 * into the 8-bit synthwave world, with copy choreographed on top.
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frameLabel = useRef<HTMLSpanElement>(null);
  const sceneLabel = useRef<HTMLSpanElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const current = useRef(0); // continuous playhead in frames (fractional during scrub)
  const small = useRef<HTMLCanvasElement | null>(null);
  const revealed = useStore((s) => s.revealed);

  /** Draw one image cover-fit, optionally as a mosaic of `block`-sized squares. */
  const paint = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, block: number, alpha = 1) => {
    const { width: cw, height: ch } = ctx.canvas;
    ctx.globalAlpha = alpha;
    if (block < 2) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, ...coverRect(img, cw, ch));
    } else {
      // render tiny, then scale up with smoothing off: hard-edged pixels
      const sw = Math.max(1, Math.round(cw / block));
      const sh = Math.max(1, Math.round(ch / block));
      const sc = (small.current ??= document.createElement("canvas"));
      if (sc.width !== sw || sc.height !== sh) {
        sc.width = sw;
        sc.height = sh;
      }
      const sctx = sc.getContext("2d")!;
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(img, ...coverRect(img, sw, sh));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sc, 0, 0, sw, sh, 0, 0, cw, ch);
    }
    ctx.globalAlpha = 1;
  };

  const draw = (v: number) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const f = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(v)));
    const img = nearestFrame(images.current, f);
    if (!img) return;

    // Pixelation peaks at the cut between the two clips and eases off either side,
    // stepping in coarse increments so it reads as "digital" rather than a blur.
    const cut = SKY_COUNT - 0.5;
    const k = Math.max(0, 1 - Math.abs(v - cut) / TRANSITION_FRAMES);
    const step = Math.round(Math.pow(k, 1.4) * BLOCK_STEPS) / BLOCK_STEPS;
    const block = step * c.width * MAX_BLOCK;
    paint(ctx, img, block);

    // A quick cross-dissolve across the cut itself, while it's at its blockiest
    const near = Math.abs(v - cut);
    if (near < 1.5) {
      const other = nearestFrame(images.current, v < cut ? SKY_COUNT : SKY_COUNT - 1);
      if (other) paint(ctx, other, block, 0.5 * (1 - near / 1.5));
    }
  };

  // Load frames + size canvas
  useEffect(() => {
    const set: FrameSet = window.innerWidth < 768 ? "mobile" : "desktop";
    images.current = loadFrames(set, (p) => {
      store.set({ progress: p });
      draw(current.current);
    });

    const resize = () => {
      const c = canvas.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(current.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll choreography
  useGSAP(
    () => {
      const state = { frame: 0 };
      let lastDrawn = -1;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      tl.to(
        state,
        {
          frame: FRAME_COUNT - 1,
          duration: 8.4,
          onUpdate: () => {
            const v = state.frame;
            current.current = v;
            const inTransition = Math.abs(v - (SKY_COUNT - 0.5)) < TRANSITION_FRAMES;
            const f = Math.round(v);
            // outside the transition only redraw on a new frame; inside, the block size changes continuously
            if (!inTransition && f === lastDrawn) return;
            lastDrawn = f;
            draw(v);
            if (frameLabel.current) frameLabel.current.textContent = String(f + 1).padStart(3, "0");
            if (sceneLabel.current) {
              const label = inTransition ? "02 / Pixelate" : f < SKY_COUNT ? "01 / Sunset" : "03 / Pixel";
              if (sceneLabel.current.textContent !== label) sceneLabel.current.textContent = label;
            }
          },
        },
        0,
      );

      // Act 1: headline lifts away
      tl.to("[data-act1]", { yPercent: -40, opacity: 0, filter: "blur(10px)", duration: 1.6, stagger: 0.12 }, 0.4);
      tl.to("[data-scroll-hint]", { opacity: 0, duration: 0.5 }, 0.2);

      // Timeline position of the sky→pixel cut; the copy is choreographed around it
      const cutAt = ((SKY_COUNT - 0.5) / (FRAME_COUNT - 1)) * 8.4;

      // Act 2: the transition line, leaving just as the sky starts to pixelate
      tl.fromTo("[data-act2] .w", { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, cutAt - 2.5);
      tl.to("[data-act2] .w", { yPercent: -110, duration: 0.7, stagger: 0.05, ease: "power3.in" }, cutAt - 0.7);

      // Act 3: letters drift up out of a soft blur, like light coming into focus
      tl.fromTo(
        "[data-act3] .ch",
        { opacity: 0, yPercent: 60, filter: "blur(12px)" },
        { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.06, ease: "power3.out" },
        cutAt + 0.7,
      );
      tl.fromTo("[data-act3-sub]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, cutAt + 1.9);

      // Outro: frame shrinks into a rounded window and the page takes over
      tl.to("[data-frame]", { scale: 0.9, borderRadius: 32, duration: 1.6, ease: "power2.inOut" }, 8.4);
      tl.to("[data-act3], [data-act3-sub]", { opacity: 0, y: -30, duration: 1, ease: "power2.in" }, 8.6);
      tl.to("[data-hud]", { opacity: 0, duration: 0.6 }, 8.6);
    },
    { scope: section },
  );

  // Intro once the preloader curtain lifts
  useGSAP(
    () => {
      if (!revealed) return;
      gsap.from("[data-act1] .w", {
        yPercent: 120,
        rotate: 4,
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.07,
        delay: 0.15,
      });
      // children, so this never fights the scroll timeline that fades the parents out
      gsap.from("[data-hud] > *, [data-scroll-hint] > *", { opacity: 0, duration: 1.2, delay: 0.7, stagger: 0.1 });
      gsap.from(canvas.current, { scale: 1.18, duration: 2.4, ease: "expo.out" });
    },
    { scope: section, dependencies: [revealed] },
  );

  const words = (text: string) =>
    text.split(" ").map((w, i) => (
      <span key={i} className="line-mask mr-[0.22em] inline-block align-top last:mr-0">
        <span className="w inline-block">{w}</span>
      </span>
    ));

  return (
    <section id="home" ref={section} className="relative h-[320vh]" aria-label="Formrise Studios">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div data-frame className="relative h-full w-full overflow-hidden will-change-transform">
          <canvas
            ref={canvas}
            className="absolute inset-0 h-full w-full"
            style={{ background: `url(${asset(`/images/poster.webp?v=${FRAME_VERSION}`)}) center/cover no-repeat` }}
            aria-hidden
          />
          {/* Legibility gradients */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,7,20,.55)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/50 to-transparent" />

          {/* Act 1 */}
          <div className="absolute inset-x-0 bottom-[14vh] px-5 md:bottom-[12vh] md:px-10">
            <p data-act1 className="mb-5 max-w-sm font-label text-[10px] uppercase leading-relaxed tracking-widest text-cream/80 md:text-xs">
              <span className="line-mask"><span className="w block">Independent design &amp; development studio</span></span>
            </p>
            <h1 className="font-display text-[13vw] font-semibold leading-[0.9] tracking-[-0.045em] md:text-[8.6vw]">
              <span data-act1 className="block">{words("We shape")}</span>
              <span data-act1 className="block">
                {words("brands")}{" "}
                <span className="line-mask inline-block align-top">
                  <span className="w inline-block pr-[0.06em] font-serif font-normal italic tracking-[-0.02em] text-sunset">
                    that rise.
                  </span>
                </span>
              </span>
            </h1>
          </div>

          {/* Act 2 */}
          <div data-act2 className="absolute inset-0 grid place-items-center px-5 text-center">
            <p className="max-w-6xl font-display text-[8.4vw] font-semibold leading-[1] tracking-[-0.04em] md:text-[5.4vw]">
              {words("From analog warmth")}
              <br />
              <span className="font-serif font-normal italic">{words("to digital worlds.")}</span>
            </p>
          </div>

          {/* Act 3 */}
          <div className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center px-5 text-center">
            <p data-act3 className="font-display text-[12vw] font-semibold leading-[0.95] tracking-[-0.045em] text-cream drop-shadow-[0_0_30px_rgba(255,61,139,.45)] md:text-[6.4vw]">
              {"Built to ".split("").map((ch, i) => (
                <span key={i} className="ch inline-block whitespace-pre">
                  {ch}
                </span>
              ))}
              {"glow.".split("").map((ch, i) => (
                <span key={`g${i}`} className="ch inline-block whitespace-pre font-serif font-normal italic text-sunset">
                  {ch}
                </span>
              ))}
            </p>
            <p data-act3-sub className="mt-5 max-w-md text-sm text-cream/80 md:text-base">
              Brand identities, websites and motion for companies ready for their next horizon.
            </p>
          </div>

          {/* HUD */}
          <div data-hud className="pointer-events-none absolute inset-x-0 top-20 flex justify-between px-5 font-label text-[9px] uppercase tracking-widest text-cream/60 md:top-8 md:px-10 md:text-[10px]">
            <span>
              Scene <span ref={sceneLabel}>01 / Sunset</span>
            </span>
            <span className="hidden md:block">Formrise ©2026</span>
            <span>
              Fr <span ref={frameLabel}>001</span>/{String(FRAME_COUNT).padStart(3, "0")}
            </span>
          </div>

          <div data-scroll-hint className="absolute bottom-6 right-5 flex items-center gap-3 md:right-10">
            <span className="font-label text-[9px] uppercase tracking-widest text-cream/70 md:text-[10px]">Scroll to rise</span>
            <span className="relative block h-10 w-px overflow-hidden bg-cream/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[drip_1.6s_ease-in-out_infinite] bg-amber" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
