"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { portfolios } from "@/content/site";
import ProjectCard from "./ProjectCard";

gsap.registerPlugin(ScrollTrigger);

/** Personal portfolios built for friends: kept apart from the main studio work. */
export default function Portfolios() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-pf-title] .w", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-pf-title]", start: "top 85%" },
      });
      gsap.from("[data-card]", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-pf-grid]", start: "top 80%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="portfolios" ref={root} className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mb-14 grid gap-6 md:mb-20 md:grid-cols-2 md:items-end">
        <div>
          <div className="mb-8 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
            <span className="size-2 bg-amber" /> Side projects
          </div>
          <h2 data-pf-title className="font-display text-[13vw] font-semibold leading-[0.88] tracking-[-0.05em] md:text-[6.5vw]">
            <span className="line-mask"><span className="w block">Personal</span></span>
            <span className="line-mask">
              <span className="w block pr-[0.06em] font-serif font-normal italic text-sunset">portfolios.</span>
            </span>
          </h2>
        </div>
        <p className="max-w-sm text-cream/60 md:justify-self-end md:text-lg">
          Portfolio sites made for friends, kept separate from the studio&apos;s client work. Abie&apos;s is a
          simple HTML &amp; CSS project; Susy&apos;s is built with Next.js and TypeScript.
        </p>
      </div>

      <div data-pf-grid className="grid gap-12 md:grid-cols-2 md:gap-8">
        {portfolios.map((p) => (
          <ProjectCard key={p.title} p={p} frameClassName="aspect-[4/3]" />
        ))}
      </div>
    </section>
  );
}
