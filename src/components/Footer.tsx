"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { nav, site } from "@/content/site";
import { useLenis } from "./SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

function Clock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: site.timezone,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{now}</span>;
}

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-ft-letter]",
        { yPercent: 100 },
        {
          yPercent: 0,
          ease: "none",
          stagger: 0.06,
          scrollTrigger: { trigger: "[data-ft-word]", start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        },
      );
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden border-t border-cream/10 px-5 pt-16 md:px-10 md:pt-20">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="max-w-xs font-display text-2xl font-medium leading-snug tracking-tight">
            Independent studio shaping brands that{" "}
            <span className="font-serif italic text-sunset">rise.</span>
          </p>
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 font-label text-[10px] uppercase tracking-widest text-cream/40">Menu</h4>
          <ul className="space-y-1.5">
            {nav.map((n) => (
              <li key={n.id}>
                <button onClick={() => lenis?.scrollTo(`#${n.id}`, { duration: 1.6 })} className="text-cream/70 transition-colors hover:text-amber">
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 font-label text-[10px] uppercase tracking-widest text-cream/40">Social</h4>
          <ul className="space-y-1.5">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="text-cream/70 transition-colors hover:text-amber">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h4 className="mb-4 font-label text-[10px] uppercase tracking-widest text-cream/40">
            {site.timezone ? "Studio time" : "Your local time"}
          </h4>
          <p className="font-label text-2xl text-cream">
            <Clock />
          </p>
          <p className="mt-1 text-cream/50">{site.location}</p>
          <button
            onClick={() => lenis?.scrollTo(0, { duration: 2.4 })}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-sm transition-colors hover:border-amber hover:text-amber"
          >
            Back to sunset ↑
          </button>
        </div>
      </div>

      <div data-ft-word className="mt-16 flex select-none justify-center overflow-hidden md:mt-20" aria-hidden>
        {"FORMRISE".split("").map((c, i) => (
          <span
            key={i}
            data-ft-letter
            className="inline-block font-display text-[16.4vw] font-bold leading-[0.8] tracking-[-0.06em] text-sunset"
            style={{ backgroundSize: "800% 100%", backgroundPosition: `${(i / 7) * 100}% 0` }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-2 border-t border-cream/10 py-6 font-label text-[10px] uppercase tracking-widest text-cream/40 md:flex-row">
        <span>© 2026 {site.name}</span>
        <span>Designed &amp; built in-house</span>
      </div>
    </footer>
  );
}
