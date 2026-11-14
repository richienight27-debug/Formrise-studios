"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { store } from "@/lib/store";
import { useLenis } from "./SmoothScroll";

const MIN_TIME = 1100; // ms: just long enough for the intro to read
const MAX_TIME = 9000; // ms: never trap people behind a slow network
const WORD = "FORMRISE";

const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  // rounded so server and client render identical strings (no hydration mismatch)
  const f = (n: number) => Math.round(n * 100) / 100;
  return { x: f(r(1) * 100), y: f(r(2) * 55), s: f(1 + r(3) * 1.6), d: f(r(4) * 4) };
});

/**
 * A realistic sun rises over a glittering sea while the hero frames load.
 * In front, the FORMRISE wordmark rises in once, each letter swelling from a thin,
 * narrow cut to a bold, wide one (Archivo's weight + width axes, animated by GSAP).
 * On exit the sun blooms and the layer dissolves into the hero's own sunset.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

  useGSAP(
    (_ctx, contextSafe) => {
      const safe = contextSafe!;
      const shown = { p: 0 };
      const start = performance.now();
      let finished = false;

      const render = () => {
        if (counter.current) counter.current.textContent = String(Math.round(shown.p * 100)).padStart(3, "0");
        // sun rises from below the horizon to sit just above it
        gsap.set(sun.current, { yPercent: 70 - shown.p * 95 });
        gsap.set("[data-pl-warm]", { opacity: 0.25 + shown.p * 0.75 });
        gsap.set("[data-pl-stars]", { opacity: 1 - shown.p * 0.7 });
        gsap.set("[data-pl-reflect]", { opacity: shown.p, scaleY: 0.4 + shown.p * 0.6 });
        gsap.set("[data-pl-bar]", { scaleX: shown.p });
      };
      // The markup is server-rendered already in its "start" pose (inline styles below),
      // so nothing jumps when JS hydrates. Hand those transforms over to GSAP in one tick.
      gsap.set([sun.current, "[data-pl-fade]", "[data-letter-wrap]", "[data-pl-reflect]", "[data-pl-bar]"], {
        clearProps: "transform",
      });
      render();

      const finish = safe(() => {
        if (finished) return;
        finished = true;
        unsub();
        const tl = gsap.timeline({ onComplete: () => setGone(true) });
        tl.to(shown, { p: 1, duration: 0.3, ease: "power2.out", onUpdate: render })
          .to("[data-pl-fade]", { yPercent: -120, opacity: 0, duration: 0.45, ease: "power3.in", stagger: 0.02 })
          .to("[data-letter-wrap]", { yPercent: -115, duration: 0.6, ease: "expo.in", stagger: 0.03 }, "<")
          // the sun blooms to fill the sky...
          .to(sun.current, { yPercent: -40, scale: 2.4, duration: 0.95, ease: "expo.in" }, "-=0.35")
          .to("[data-pl-flare]", { opacity: 1, duration: 0.75, ease: "power2.in" }, "<0.2")
          .add(() => {
            document.documentElement.classList.remove("is-loading");
            store.set({ revealed: true });
            lenisRef.current?.start();
          })
          // ...and dissolves into the hero's sunset
          .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.out" });
      });

      // created later (from the store / timers), so wrap them to be cleaned up on unmount
      const onProgress = safe(() => {
        const target = store.get().progress;
        gsap.to(shown, { p: Math.min(target, 0.99), duration: 0.5, ease: "power2.out", onUpdate: render, overwrite: true });
        if (target >= 1) {
          const wait = Math.max(0, MIN_TIME - (performance.now() - start));
          gsap.delayedCall(wait / 1000, finish);
        }
      });
      const unsub = store.subscribe(onProgress);
      onProgress();
      gsap.delayedCall(MAX_TIME / 1000, finish);

      gsap.fromTo("[data-pl-fade]", { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.04, delay: 0.1 });
      gsap.fromTo("[data-letter-wrap]", { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.045 });
      // letters swell from a thin, narrow cut to bold and wide as they rise in
      gsap.fromTo(
        "[data-letter]",
        { "--w": 200, "--d": 70 },
        { "--w": 640, "--d": 112, duration: 1.2, ease: "power3.out", stagger: 0.045, delay: 0.1 },
      );
      return () => unsub();
    },
    { scope: root },
  );

  useEffect(() => {
    if (lenis && store.get().revealed) lenis.start();
  }, [lenis]);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100] overflow-hidden bg-ink" aria-label="Loading" role="status">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#07050f 0%,#120c26 38%,#2a1240 56%,#4a1a3c 66%)" }} />
      <div
        data-pl-warm
        className="absolute inset-0"
        style={{
          opacity: 0.25,
          background:
            "radial-gradient(120% 60% at 50% 66%, rgba(255,140,60,.75) 0%, rgba(255,61,139,.35) 30%, rgba(108,43,217,.12) 55%, transparent 75%)",
        }}
      />
      <div data-pl-stars className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-cream"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              opacity: 0.6,
              animation: `twinkle 3.2s ${s.d}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Sun, clipped by the horizon (top 66%) */}
      <div className="absolute inset-x-0 top-0 h-[66%] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div ref={sun} className="relative aspect-square w-[min(38vw,320px)] will-change-transform" style={{ transform: "translateY(70%)" }}>
          <div className="absolute -inset-[250%] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,61,139,.22) 0%, transparent 60%)" }} />
          <div className="absolute -inset-[110%] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,120,60,.45) 0%, transparent 62%)" }} />
          <div className="absolute -inset-[40%] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,214,140,.75) 0%, rgba(255,170,90,.25) 45%, transparent 70%)" }} />
          {/* corona rays */}
          <div
            className="absolute -inset-[90%] animate-[spin-slow_60s_linear_infinite] rounded-full opacity-50 will-change-transform"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,226,170,.0) 0deg, rgba(255,226,170,.16) 3deg, rgba(255,226,170,0) 7deg, rgba(255,226,170,0) 15deg)",
              WebkitMaskImage: "radial-gradient(circle, #000 18%, transparent 62%)",
              maskImage: "radial-gradient(circle, #000 18%, transparent 62%)",
            }}
          />
          {/* disc */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, #fffef6 0%, #fff4cf 28%, #ffd98a 52%, #ffae4f 74%, #ff7a32 92%, #ff6a3d 100%)",
              boxShadow: "0 0 40px 10px rgba(255,214,140,.9), 0 0 120px 40px rgba(255,150,70,.55)",
            }}
          />
        </div>
        </div>
      </div>

      {/* Sea */}
      <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: "linear-gradient(180deg,#2a1636 0%,#120c26 45%,#07050f 100%)" }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,214,140,.9),transparent)" }} />
        <div className="absolute inset-0 flex justify-center">
        <div
          data-pl-reflect
          className="h-full w-[min(46vw,420px)] origin-top"
          style={{
            opacity: 0,
            transform: "scaleY(0.4)",
            background: "linear-gradient(180deg, rgba(255,214,140,.85) 0%, rgba(255,120,60,.45) 35%, transparent 85%)",
            WebkitMaskImage:
              "repeating-linear-gradient(180deg,#000 0px,#000 3px,transparent 3px,transparent 9px), radial-gradient(50% 100% at 50% 0%, #000 30%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage:
              "repeating-linear-gradient(180deg,#000 0px,#000 3px,transparent 3px,transparent 9px), radial-gradient(50% 100% at 50% 0%, #000 30%, transparent 100%)",
            maskComposite: "intersect",
          }}
        >
          <div className="h-full w-full animate-[glint_2.4s_ease-in-out_infinite] bg-white/10 will-change-[opacity]" />
        </div>
        </div>
      </div>

      {/* Bloom used on exit */}
      <div data-pl-flare className="absolute inset-0 opacity-0" style={{ background: "radial-gradient(circle at 50% 55%, #fff4d6 0%, #ffb347 40%, #ff6a3d 75%, #ff3d8b 100%)" }} />

      {/* Wordmark */}
      <div className="absolute inset-x-0 top-[66%] flex -translate-y-[78%] justify-center px-4">
        <div
          className="flex select-none font-display text-[15vw] leading-none tracking-[-0.02em] text-cream md:text-[12.5vw]"
          aria-label="Formrise"
        >
          {WORD.split("").map((c, i) => (
            <span key={i} className="overflow-clip pb-[0.06em]">
              <span data-letter-wrap className="block" style={{ transform: "translateY(110%)" }}>
                <span
                  data-letter
                  className="inline-block"
                  style={{ "--w": 200, "--d": 70, fontVariationSettings: `"wght" var(--w), "wdth" var(--d)` } as React.CSSProperties}
                >
                  {c}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Chrome */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 md:p-10">
        <div className="flex justify-between overflow-clip font-label text-[10px] uppercase text-cream/70 md:text-xs">
          <span data-pl-fade style={{ transform: "translateY(120%)" }} className="block">Formrise Studios ©2026</span>
          <span data-pl-fade style={{ transform: "translateY(120%)" }} className="block">Dehradun, IN</span>
        </div>
        <div className="flex items-end justify-between gap-6 overflow-clip">
          <div data-pl-fade style={{ transform: "translateY(120%)" }} className="w-40 md:w-64">
            <div className="mb-3 font-label text-[10px] uppercase text-cream/60 md:text-xs">Raising the horizon</div>
            <div className="h-px w-full bg-cream/15">
              <div data-pl-bar className="h-full origin-left scale-x-0" style={{ background: "var(--sunset-x)" }} />
            </div>
          </div>
          <span data-pl-fade style={{ transform: "translateY(120%)" }} className="block font-display text-5xl font-light leading-none tracking-tight text-cream md:text-7xl">
            <span ref={counter}>000</span>
            <span className="align-top text-lg text-cream/50 md:text-2xl">%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
