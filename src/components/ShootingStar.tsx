"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Geo = { w: number; h: number; d: string; start: number; end: number };

const SPARKS = 28;
const HEAD_AT = 0.42; // the star rides this far down the viewport

// deterministic pseudo-random so the route is the same on every visit
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Wavy route down the page from just after the hero to the footer wordmark.
 * Every segment's control points are vertically aligned, so y only ever increases:
 * that makes "where on the path is this scroll position" a simple lookup.
 */
function buildRoute(w: number, start: number, end: number) {
  const narrow = w < 768;
  const minX = w * (narrow ? 0.12 : 0.08);
  const maxX = w * (narrow ? 0.88 : 0.92);
  const step = narrow ? 520 : 720;
  const n = Math.max(2, Math.round((end - start) / step));
  const pts = Array.from({ length: n + 1 }, (_, i) => ({
    x: i === n ? w * 0.5 : minX + (maxX - minX) * (0.5 + 0.5 * Math.sin(i * 1.9 + rand(i) * 2.2)),
    y: start + ((end - start) * i) / n,
  }));
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dy = (b.y - a.y) * 0.5;
    d += ` C ${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - dy).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

/**
 * A little sunset star that falls down the page as you scroll, leaving a dotted
 * trail and shedding sparks, then bursts when it lands on the footer wordmark.
 */
export default function ShootingStar() {
  const box = useRef<HTMLDivElement>(null);
  const route = useRef<SVGPathElement>(null);
  const reveal = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);
  const sparks = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  // (Re)measure the page: it changes height when ScrollTrigger adds pin spacers
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const host = el.parentElement!;
        const top = host.getBoundingClientRect().top + window.scrollY;
        const w = host.clientWidth;
        const h = host.scrollHeight;
        const hero = document.getElementById("home");
        const word = document.querySelector("[data-ft-word]");
        const start = hero ? hero.offsetHeight - window.innerHeight * 0.55 : 200;
        const end = word ? word.getBoundingClientRect().top + window.scrollY - top + 30 : h - 200;
        setGeo((g) =>
          g && g.w === w && g.h === h && Math.abs(g.start - start) < 2 && Math.abs(g.end - end) < 2
            ? g
            : { w, h, start, end, d: buildRoute(w, start, end) },
        );
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el.parentElement!);
    ScrollTrigger.addEventListener("refresh", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ScrollTrigger.removeEventListener("refresh", measure);
    };
  }, []);

  // Follow the scroll along the route
  useEffect(() => {
    const path = route.current;
    const mask = reveal.current;
    const star = head.current;
    if (!geo || !path || !mask || !star) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = path.getTotalLength();

    // y → length lookup (y increases monotonically along the route)
    const lens: number[] = [];
    const ys: number[] = [];
    for (let l = 0; l <= total; l += 6) {
      lens.push(l);
      ys.push(path.getPointAtLength(l).y);
    }
    const lengthAtY = (y: number) => {
      if (y <= ys[0]) return 0;
      if (y >= ys[ys.length - 1]) return total;
      let lo = 0;
      let hi = ys.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < y) lo = mid;
        else hi = mid;
      }
      const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
      return lens[lo] + (lens[hi] - lens[lo]) * t;
    };

    mask.style.strokeDasharray = `${total} ${total}`;
    const pool = Array.from(sparks.current?.children ?? []) as SVGCircleElement[];
    let next = 0;
    let lastSpark = -1e9;
    let landed = false;

    const spark = (x: number, y: number, burst = false) => {
      const c = pool[next++ % pool.length];
      if (!c) return;
      const a = burst ? Math.random() * Math.PI * 2 : Math.PI * (0.15 + Math.random() * 0.7) * -1;
      const dist = burst ? 30 + Math.random() * 70 : 10 + Math.random() * 26;
      gsap.killTweensOf(c);
      gsap.fromTo(
        c,
        { attr: { cx: x, cy: y, r: burst ? 2.6 : 1.8 }, opacity: 1 },
        {
          attr: { cx: x + Math.cos(a) * dist, cy: y + Math.sin(a) * dist * (burst ? 1 : 0.6), r: 0 },
          opacity: 0,
          duration: 0.7 + Math.random() * 0.7,
          ease: "power2.out",
        },
      );
    };

    const state = { len: 0 };
    const render = () => {
      const len = state.len;
      mask.style.strokeDashoffset = String(total - len);
      const visible = len > 2;
      star.style.opacity = visible ? "1" : "0";
      if (!visible) return;
      const p = path.getPointAtLength(len);
      const q = path.getPointAtLength(Math.min(total, len + 4));
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      star.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(angle - 90).toFixed(1)})`);

      if (!reduce && Math.abs(len - lastSpark) > 16) {
        lastSpark = len;
        spark(p.x, p.y);
      }
      if (!reduce && !landed && len >= total - 2) {
        landed = true;
        for (let i = 0; i < 18; i++) spark(p.x, p.y, true);
      }
      if (len < total - 40) landed = false;
    };

    const to = gsap.quickTo(state, "len", { duration: reduce ? 0.01 : 0.7, ease: "power3.out", onUpdate: render });
    const host = box.current!.parentElement!;
    const follow = () => {
      const top = host.getBoundingClientRect().top + window.scrollY;
      to(lengthAtY(window.scrollY - top + window.innerHeight * HEAD_AT));
    };
    follow();
    window.addEventListener("scroll", follow, { passive: true });
    return () => {
      window.removeEventListener("scroll", follow);
      gsap.killTweensOf(state);
    };
  }, [geo]);

  return (
    // No z-index here on purpose: a z-index would make this its own stacking context and the
    // trail's `difference` blend could no longer see the page beneath it. Coming last in the
    // DOM already paints it above the sections.
    <div ref={box} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {geo && (
        <>
          {/* dotted trail: `difference` keeps it visible on both the dark page and the cream section */}
          <svg width={geo.w} height={geo.h} className="absolute left-0 top-0" style={{ mixBlendMode: "difference" }}>
            <defs>
              <mask id="star-trail" maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.h}>
                <path ref={reveal} d={geo.d} fill="none" stroke="#fff" strokeWidth="12" />
              </mask>
            </defs>
            <path ref={route} d={geo.d} fill="none" stroke="#fff3e6" strokeOpacity=".7" strokeWidth="1.6" strokeDasharray="1 9" strokeLinecap="round" mask="url(#star-trail)" />
          </svg>

          <svg width={geo.w} height={geo.h} className="absolute left-0 top-0 overflow-visible">
            <defs>
              <radialGradient id="star-glow">
                <stop offset="0%" stopColor="#ffd27a" stopOpacity=".9" />
                <stop offset="45%" stopColor="#ff6a3d" stopOpacity=".35" />
                <stop offset="100%" stopColor="#ff3d8b" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="star-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fffef6" />
                <stop offset="60%" stopColor="#ffd27a" />
                <stop offset="100%" stopColor="#ff6a3d" />
              </linearGradient>
            </defs>
            <g ref={sparks}>
              {Array.from({ length: SPARKS }, (_, i) => (
                <circle key={i} r="0" fill={i % 3 === 0 ? "#ff3d8b" : i % 3 === 1 ? "#ffb347" : "#fff3e6"} opacity="0" />
              ))}
            </g>
            <g ref={head} style={{ opacity: 0, transition: "opacity .4s" }}>
              <circle r="28" fill="url(#star-glow)" />
              <g className="star-twinkle" style={{ scale: "1.3" }}>
                {/* four-point sparkle */}
                <path d="M0 -13 C 1.6 -3.2, 3.2 -1.6, 13 0 C 3.2 1.6, 1.6 3.2, 0 13 C -1.6 3.2, -3.2 1.6, -13 0 C -3.2 -1.6, -1.6 -3.2, 0 -13 Z" fill="url(#star-fill)" />
                <circle r="2.2" fill="#fffef6" />
              </g>
            </g>
          </svg>
        </>
      )}
    </div>
  );
}
