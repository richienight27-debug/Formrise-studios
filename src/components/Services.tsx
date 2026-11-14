"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { services } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

export default function Services() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-sv-title] .w", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-sv-title]", start: "top 85%" },
      });
      gsap.utils.toArray<HTMLElement>("[data-sv-row]").forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%" } });
        tl.from(row.querySelector("[data-line]"), { scaleX: 0, transformOrigin: "left", duration: 1.2, ease: "expo.out" })
          .from(row.querySelectorAll("[data-rise]"), { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.06 }, 0.1);
      });
    },
    { scope: root },
  );

  return (
    <section id="services" ref={root} className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mb-14 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end">
        <h2 data-sv-title className="font-display text-[14vw] font-semibold leading-[0.88] tracking-[-0.05em] md:text-[8vw]">
          <span className="line-mask"><span className="w block">What we</span></span>
          <span className="line-mask">
            <span className="w block font-serif font-normal italic text-sunset">make.</span>
          </span>
        </h2>
        <p className="max-w-sm text-cream/60 md:text-lg">
          Five disciplines, one team. Every engagement is shaped around what actually moves your brand forward.
        </p>
      </div>

      <ul>
        {services.map((s, i) => (
          <li key={s.title} data-sv-row className="group relative">
            <div data-line className="h-px w-full bg-cream/20" />
            <div className="relative overflow-hidden">
              {/* hover fill */}
              <div
                className="absolute inset-0 transition-[clip-path] duration-700 ease-[cubic-bezier(.76,0,.24,1)] [clip-path:inset(100%_0_0_0)] group-hover:[clip-path:inset(0_0_0_0)]"
                style={{ background: "var(--sunset-x)" }}
              />
              <div className="relative grid gap-4 py-8 transition-colors duration-500 group-hover:text-ink md:grid-cols-12 md:items-center md:gap-8 md:px-4 md:py-10">
                <span className="line-mask md:col-span-1">
                  <span data-rise className="block font-label text-xs text-amber transition-colors group-hover:text-ink">
                    0{i + 1}
                  </span>
                </span>
                <h3 className="line-mask md:col-span-5">
                  <span data-rise className="block font-display text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
                    {/* hover motion lives on an inner span so it never fights GSAP's transform */}
                    <span className="inline-block transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-3">
                      {s.title}
                    </span>
                  </span>
                </h3>
                <p className="line-mask md:col-span-4">
                  <span data-rise className="block text-cream/60 transition-colors group-hover:text-ink/80">
                    {s.body}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
                  {s.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-cream/20 px-3 py-1 text-xs text-cream/70 transition-colors group-hover:border-ink/30 group-hover:text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
        <li className="h-px w-full bg-cream/20" aria-hidden />
      </ul>
    </section>
  );
}
