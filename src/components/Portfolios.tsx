"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { portfolios } from "@/content/site";
import ProjectDeck from "./ProjectDeck";
import TypeLabel from "./TypeLabel";

gsap.registerPlugin(ScrollTrigger);

/** Personal portfolios built for friends: kept apart from the main studio work, in their own deck. */
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
    },
    { scope: root },
  );

  return (
    <section id="portfolios" ref={root} className="relative">
      <div className="grid gap-6 px-5 pt-24 md:grid-cols-2 md:items-end md:px-10 md:pt-36">
        <div>
          <div className="mb-8 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
            <span className="size-2 bg-amber" /> <TypeLabel text="Side projects" />
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
      <ProjectDeck items={portfolios} />
    </section>
  );
}
