"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring, type Transition } from "motion/react";
import { nav, site } from "@/content/site";
import { store, useStore } from "@/lib/store";
import { useLenis } from "./SmoothScroll";

type Mode = "idle" | "compact" | "expanded";

const spring: Transition = { type: "spring", bounce: 0.28, duration: 0.6 };
const content = {
  initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { ...spring, delay: 0.06 } },
  exit: { opacity: 0, scale: 0.92, filter: "blur(6px)", transition: { duration: 0.14 } },
};

const LABELS: Record<string, string> = {
  home: "Horizon",
  intro: "Manifesto",
  services: "Services",
  work: "Studio Work",
  portfolios: "Portfolios",
  process: "Process",
  about: "The Founder",
  contact: "Say hello",
};
const OBSERVED = Object.keys(LABELS);

function Sun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id="isl-glow" cx="12" cy="15" r="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb347" stopOpacity=".7" />
          <stop offset="100%" stopColor="#ff3d8b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isl-sun" cx="12" cy="12.5" r="6.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffef6" />
          <stop offset="45%" stopColor="#ffd98a" />
          <stop offset="85%" stopColor="#ff9a45" />
          <stop offset="100%" stopColor="#ff6a3d" />
        </radialGradient>
        <clipPath id="isl-horizon">
          <rect x="0" y="0" width="24" height="17" />
        </clipPath>
      </defs>
      <circle cx="12" cy="15" r="11" fill="url(#isl-glow)" clipPath="url(#isl-horizon)" />
      <circle cx="12" cy="15" r="6.2" fill="url(#isl-sun)" clipPath="url(#isl-horizon)" />
      <rect x="2" y="17" width="20" height="1.2" rx=".6" fill="#fff3e6" opacity=".85" />
    </svg>
  );
}

function ProgressRing() {
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return (
    <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="rgba(255,243,230,.15)" strokeWidth="2.5" />
      <motion.circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="url(#ring-g)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ pathLength: p }}
      />
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#ff3d8b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Navigation styled after Apple's Dynamic Island: a black pill that morphs
 * between a compact "activity" state, an idle state showing the live section,
 * and an expanded menu. Every size change is a spring-driven layout animation.
 */
export default function DynamicIsland() {
  const [mode, setMode] = useState<Mode>("idle");
  const [touch, setTouch] = useState(false);
  const revealed = useStore((s) => s.revealed);
  const section = useStore((s) => s.section);
  const lenis = useLenis();
  const ref = useRef<HTMLDivElement>(null);
  const expanded = mode === "expanded";

  // Touch devices and narrow screens get the tap-to-open card menu instead of hover-to-expand
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (max-width: 767px)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Track the active section
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && store.set({ section: e.target.id }));
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    const t = setTimeout(() => {
      OBSERVED.forEach((id) => {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }, 300);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, []);

  // Compact while scrolling down, idle when scrolling up / near the top
  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => {
      setMode((m) => {
        if (m === "expanded") return m;
        if (lenis.scroll < 120) return "idle";
        return lenis.direction === 1 ? "compact" : "idle";
      });
    };
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMode("idle");
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode("idle");
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const go = useCallback(
    (id: string) => {
      setMode("idle");
      const target = id === "home" ? 0 : `#${id}`;
      if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    },
    [lenis],
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex justify-center px-3 md:top-5">
      <motion.div
        ref={ref}
        layout
        initial={{ y: -80, opacity: 0 }}
        animate={revealed ? { y: 0, opacity: 1 } : { y: -80, opacity: 0 }}
        transition={spring}
        onPointerEnter={() => !touch && setMode("expanded")}
        onPointerLeave={() => !touch && setMode("idle")}
        style={{ borderRadius: expanded && touch ? 30 : 999 }}
        className="pointer-events-auto relative overflow-hidden bg-black text-cream shadow-[0_10px_40px_-10px_rgba(255,61,139,.35),inset_0_0_0_1px_rgba(255,243,230,.08)]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "compact" && (
            <motion.button
              key="compact"
              {...content}
              onClick={() => setMode("expanded")}
              className="flex h-10 items-center gap-3 px-3"
              aria-label="Open menu"
            >
              <Sun className="size-6" />
              <span className="flex gap-[3px]" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-[3px] rounded-full bg-amber"
                    animate={{ height: [6, 14, 6] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </span>
              <ProgressRing />
            </motion.button>
          )}

          {mode === "idle" && (
            <motion.button
              key="idle"
              {...content}
              onClick={() => setMode("expanded")}
              className="flex h-11 items-center gap-3 pl-3 pr-3 md:h-12 md:pr-4"
              aria-label="Open menu"
              aria-expanded={false}
            >
              <Sun className="size-7" />
              <span className="font-display text-[15px] font-semibold tracking-tight">{site.short}</span>
              <span className="h-4 w-px bg-cream/20" />
              <span className="relative block h-5 w-[92px] overflow-hidden text-left md:w-[104px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={section}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-110%" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 truncate font-label text-[10px] uppercase leading-5 tracking-wider text-cream/70"
                  >
                    {LABELS[section] ?? "Horizon"}
                  </motion.span>
                </AnimatePresence>
              </span>
              <ProgressRing />
            </motion.button>
          )}

          {mode === "expanded" && !touch && (
            <motion.div key="exp-desktop" {...content} className="flex h-12 items-center gap-1 pl-3 pr-1.5">
              <button onClick={() => go("home")} className="mr-2 flex items-center gap-2" aria-label="Back to top">
                <Sun className="size-7" />
              </button>
              {nav.map((n, i) => (
                <motion.button
                  key={n.id}
                  onClick={() => go(n.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.035 } }}
                  className={`relative rounded-full px-3.5 py-2 text-sm transition-colors hover:bg-cream/10 ${
                    section === n.id ? "text-amber" : "text-cream/80 hover:text-cream"
                  }`}
                >
                  {n.label}
                </motion.button>
              ))}
              <button
                onClick={() => go("contact")}
                className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.04]"
                style={{ background: "var(--sunset-x)" }}
              >
                Let&apos;s talk
              </button>
            </motion.div>
          )}

          {mode === "expanded" && touch && (
            <motion.div key="exp-touch" {...content} className="w-[min(92vw,380px)] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="size-7" />
                  <span className="font-display text-[15px] font-semibold">{site.short}</span>
                </div>
                <button
                  onClick={() => setMode("idle")}
                  className="grid size-9 place-items-center rounded-full bg-cream/10"
                  aria-label="Close menu"
                >
                  <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-1">
                {nav.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.05 } }}
                  >
                    <button
                      onClick={() => go(n.id)}
                      className="flex w-full items-baseline justify-between py-1.5 font-display text-4xl font-semibold tracking-tight"
                    >
                      <span className={section === n.id ? "text-sunset" : ""}>{n.label}</span>
                      <span className="font-label text-[10px] text-cream/40">0{i + 1}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
              <a
                href={`mailto:${site.email}`}
                className="mt-5 block rounded-2xl px-4 py-3 text-center text-sm font-medium text-ink"
                style={{ background: "var(--sunset-x)" }}
              >
                {site.email}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
