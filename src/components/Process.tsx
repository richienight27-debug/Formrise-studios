"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { process } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

type Pt = { x: number; y: number };

/**
 * Route geometry. Desktop sails left→right across a wide sea; phones zig-zag down.
 * `start` is a short lead-in so the boat sails *into* the first stop.
 */
const LAYOUTS = {
  wide: {
    viewBox: "0 0 1600 640",
    start: { x: 60, y: 400 },
    stops: [
      { x: 330, y: 230 },
      { x: 700, y: 450 },
      { x: 1060, y: 220 },
      { x: 1430, y: 420 },
    ],
    horizontal: true,
    labelOffset: (i: number) => (i % 2 === 0 ? -44 : 64), // above / below alternately
    boatScale: 1.5,
  },
  tall: {
    viewBox: "0 0 400 620",
    start: { x: 200, y: 20 },
    stops: [
      { x: 110, y: 120 },
      { x: 290, y: 260 },
      { x: 110, y: 400 },
      { x: 290, y: 540 },
    ],
    horizontal: false,
    labelOffset: () => 0,
    boatScale: 1.05,
  },
} as const;

type Layout = (typeof LAYOUTS)[keyof typeof LAYOUTS];

/** Smooth S-curves between points; tangents follow the main direction of travel. */
function buildSegments(l: Layout) {
  const pts: Pt[] = [l.start, ...l.stops];
  const segs: string[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (l.horizontal) {
      const dx = (b.x - a.x) * 0.5;
      segs.push(`C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`);
    } else {
      const dy = (b.y - a.y) * 0.5;
      segs.push(`C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`);
    }
  }
  const head = `M ${l.start.x} ${l.start.y}`;
  return { d: `${head} ${segs.join(" ")}`, partial: (n: number) => `${head} ${segs.slice(0, n).join(" ")}` };
}

/** Original little sailboat: hull, mast, two sails and a sunset pennant. */
function Boat() {
  return (
    <g>
      {/* wake */}
      <path d="M -46 6 Q -30 2 -18 6" stroke="#fff3e6" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M -40 12 Q -26 8 -16 11" stroke="#fff3e6" strokeOpacity=".2" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g className="boat-bob">
        {/* hull */}
        <path d="M -24 0 L 26 0 L 18 12 L -16 12 Z" fill="#fff3e6" />
        <path d="M -22 3 L 24 3" stroke="#ff6a3d" strokeWidth="2" />
        {/* mast */}
        <line x1="2" y1="0" x2="2" y2="-46" stroke="#fff3e6" strokeWidth="2.2" strokeLinecap="round" />
        {/* sails */}
        <path d="M 4 -44 L 4 -4 L 26 -4 Z" fill="url(#sail-main)" />
        <path d="M 0 -38 L 0 -6 L -18 -6 Z" fill="url(#sail-jib)" />
        {/* pennant */}
        <path d="M 2 -46 L 14 -42 L 2 -38 Z" fill="#ff3d8b" />
      </g>
    </g>
  );
}

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const route = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const boat = useRef<SVGGElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [layoutKey, setLayoutKey] = useState<keyof typeof LAYOUTS>("wide");
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(0); // how many stops the boat has arrived at
  const layout = LAYOUTS[layoutKey];
  const { d, partial } = buildSegments(layout);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setLayoutKey(mq.matches ? "tall" : "wide");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Scroll drives the boat along the route, pausing at each stop
  useGSAP(
    () => {
      const path = route.current!;
      const total = path.getTotalLength();
      // exact distance along the route of every stop (each segment ends on a stop)
      const measure = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const stopLen = layout.stops.map((_, i) => {
        measure.setAttribute("d", partial(i + 1));
        return measure.getTotalLength();
      });

      gsap.set(trail.current, { strokeDasharray: total, strokeDashoffset: total });

      const state = { len: 0 };
      const place = () => {
        const len = Math.min(total, Math.max(0, state.len));
        const p = path.getPointAtLength(len);
        const ahead = path.getPointAtLength(Math.min(total, len + 2));
        const behind = path.getPointAtLength(Math.max(0, len - 2));
        let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
        // a boat heels, it doesn't flip: keep it upright whatever the route does
        if (!layout.horizontal) angle = gsap.utils.clamp(-22, 22, (angle - 90) * 0.35);
        else angle = gsap.utils.clamp(-22, 22, angle);
        boat.current?.setAttribute("transform", `translate(${p.x} ${p.y - 6}) rotate(${angle}) scale(${layout.boatScale})`);
        if (trail.current) trail.current.style.strokeDashoffset = String(total - len);

        const arrived = stopLen.filter((s) => len >= s - 1).length;
        setReached(arrived);
        setActive(Math.min(layout.stops.length - 1, arrived === 0 ? 0 : arrived - 1));
      };
      place();

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
        onUpdate: place,
      });
      stopLen.forEach((s, i) => {
        tl.to(state, { len: s, duration: i === 0 ? 0.6 : 1, ease: "sine.inOut" }); // sail to the stop
        tl.to(state, { len: s, duration: 0.7 }); // drop anchor while the step is read
      });

      gsap.from("[data-pr-title] .w", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-pr-title]", start: "top 85%" },
      });
    },
    { scope: root, dependencies: [layoutKey], revertOnUpdate: true },
  );

  // Swap the explanation panel when the boat reaches a new stop
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-panel-in]",
        { yPercent: 40, opacity: 0, filter: "blur(6px)" },
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out", stagger: 0.05 },
      );
    },
    { scope: panel, dependencies: [active], revertOnUpdate: true },
  );

  const step = process[active];

  return (
    <section id="process" ref={root} className="relative">
      <div className="px-5 pt-24 md:px-10 md:pt-36">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <h2 data-pr-title className="font-display text-[14vw] font-semibold leading-[0.88] tracking-[-0.05em] md:text-[8vw]">
            <span className="line-mask"><span className="w block">How it</span></span>
            <span className="line-mask"><span className="w block font-serif font-normal italic text-sunset">unfolds.</span></span>
          </h2>
          <p className="max-w-sm text-cream/60 md:justify-self-end md:text-lg">
            Four stops from first call to launch. Scroll to sail the route; we drop anchor at each one.
          </p>
        </div>
      </div>

      {/* Scroll runway: the stage stays pinned while the boat sails */}
      <div ref={stage} className="relative h-[420vh]">
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden px-5 pb-6 pt-20 md:px-10 md:pb-10 md:pt-24">
          {/* Sea + route */}
          <div className="relative min-h-0 flex-1">
            <svg viewBox={layout.viewBox} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id="route-grad" x1="0" y1="0" x2={layout.horizontal ? "1" : "0"} y2={layout.horizontal ? "0" : "1"}>
                  <stop offset="0%" stopColor="#ffd27a" />
                  <stop offset="40%" stopColor="#ff6a3d" />
                  <stop offset="75%" stopColor="#ff3d8b" />
                  <stop offset="100%" stopColor="#6c2bd9" />
                </linearGradient>
                <linearGradient id="sail-main" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd27a" />
                  <stop offset="100%" stopColor="#ff6a3d" />
                </linearGradient>
                <linearGradient id="sail-jib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff3e6" />
                  <stop offset="100%" stopColor="#ffb347" />
                </linearGradient>
              </defs>

              {/* drifting waves */}
              <g className="sea-drift" opacity=".5">
                {Array.from({ length: layout.horizontal ? 7 : 9 }, (_, i) => {
                  const [, , w, h] = layout.viewBox.split(" ").map(Number);
                  const y = (h / (layout.horizontal ? 7 : 9)) * (i + 0.5);
                  const x0 = (i * 97) % 220;
                  return (
                    <path
                      key={i}
                      d={`M ${x0 - 200} ${y} q 20 -8 40 0 t 40 0 M ${x0 + w * 0.45} ${y + 14} q 20 -8 40 0 t 40 0`}
                      stroke="#fff3e6"
                      strokeOpacity=".12"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* route ahead (dashed) and the trail already sailed (glowing gradient) */}
              <path ref={route} d={d} fill="none" stroke="#fff3e6" strokeOpacity=".22" strokeWidth="2.5" strokeDasharray="2 12" strokeLinecap="round" />
              <path ref={trail} d={d} fill="none" stroke="url(#route-grad)" strokeWidth="4" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,106,61,.6))" }} />

              {/* stops */}
              {layout.stops.map((s, i) => {
                const on = i < reached;
                const here = i === reached - 1;
                // phones: label sits on the side of the stop that faces the middle, so it never runs off-screen
                const labelX = layout.horizontal ? s.x : s.x + (s.x < 200 ? 26 : -26);
                const labelY = layout.horizontal ? s.y + layout.labelOffset(i) : s.y + 6;
                const anchor = layout.horizontal ? "middle" : s.x < 200 ? "start" : "end";
                return (
                  <g key={i}>
                    {here && <circle cx={s.x} cy={s.y} r="14" fill="none" stroke="#ffb347" strokeWidth="2" className="stop-pulse" />}
                    <circle cx={s.x} cy={s.y} r={here ? 11 : 8} fill={on ? "#ffb347" : "#0a0714"} stroke={on ? "#ffd27a" : "#fff3e6"} strokeOpacity={on ? 1 : 0.4} strokeWidth="2.5" style={{ transition: "r .4s, fill .4s" }} />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={anchor}
                      className="font-display"
                      fill="#fff3e6"
                      fillOpacity={on ? 1 : 0.4}
                      style={{ fontSize: layout.horizontal ? 26 : 18, fontWeight: 600, transition: "fill-opacity .4s" }}
                    >
                      <tspan className="font-label" style={{ fontSize: layout.horizontal ? 14 : 11, letterSpacing: "0.14em" }} fill={on ? "#ffb347" : "#fff3e6"}>
                        {process[i].step}
                      </tspan>
                      <tspan dx="10">{process[i].title}</tspan>
                    </text>
                  </g>
                );
              })}

              <g ref={boat}>
                <Boat />
              </g>
            </svg>
          </div>

          {/* Explanation of the current stop */}
          <div ref={panel} className="relative mt-4 border-t border-cream/15 pt-5 md:mt-6 md:pt-8">
            <div className="grid gap-4 md:grid-cols-12 md:items-start md:gap-8">
              <div className="flex items-baseline gap-4 md:col-span-5">
                <span data-panel-in className="shrink-0 whitespace-nowrap font-label text-xs uppercase text-amber">
                  Stop {step.step} / 0{process.length}
                </span>
                <h3 data-panel-in className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
                  {step.title}
                </h3>
              </div>
              <div className="md:col-span-7">
                <p data-panel-in className="max-w-2xl text-base leading-snug text-cream/80 md:text-xl">
                  {step.body}
                </p>
                <div data-panel-in className="mt-4 flex flex-wrap gap-2">
                  {step.points.map((pt) => (
                    <span key={pt} className="rounded-full border border-cream/25 px-3 py-1 text-sm text-cream/80">
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
