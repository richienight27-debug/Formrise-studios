"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { projects } from "@/content/site";
import ProjectDeck from "./ProjectDeck";
import TypeLabel from "./TypeLabel";

gsap.registerPlugin(ScrollTrigger);

/** Main studio work (client & brand websites) as a pinned deck, ending on an open slot. */
export default function Work() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-wk-title] .w", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-wk-title]", start: "top 85%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className="relative">
      <div className="grid gap-6 px-5 pt-24 md:grid-cols-2 md:items-end md:px-10 md:pt-36">
        <div>
          <div className="mb-8 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
            <span className="size-2 bg-magenta" /> <TypeLabel text="Studio work" />
          </div>
          <h2 data-wk-title className="font-display text-[14vw] font-semibold leading-[0.88] tracking-[-0.05em] md:text-[7vw]">
            <span className="line-mask"><span className="w block">Work that</span></span>
            <span className="line-mask">
              <span className="w block pr-[0.06em] font-serif font-normal italic text-sunset">rises.</span>
            </span>
          </h2>
        </div>
        <p className="max-w-sm text-cream/60 md:justify-self-end md:text-lg">
          Websites for brands and businesses, designed and built in-house. Scroll slowly; each card lifts away to
          reveal the next.
        </p>
      </div>
      <ProjectDeck items={projects} cta />
    </section>
  );
}
