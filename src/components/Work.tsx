"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { projects } from "@/content/site";
import { useLenis } from "./SmoothScroll";
import ProjectCard from "./ProjectCard";

gsap.registerPlugin(ScrollTrigger);

/** Horizontal, pinned gallery of the main studio work (client & brand websites). */
export default function Work() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current!;
        const distance = () => Math.max(0, t.scrollWidth - window.innerWidth);
        const scroll = gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        // Inner parallax on each card, tied to the horizontal movement
        gsap.utils.toArray<HTMLElement>("[data-card-inner]").forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: -12 },
            {
              xPercent: 12,
              ease: "none",
              scrollTrigger: {
                trigger: el.parentElement,
                containerAnimation: scroll,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        });
        gsap.to("[data-work-progress]", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
        });
      });
      gsap.from("[data-card]", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className="relative overflow-hidden md:h-svh">
      <div
        ref={track}
        className="flex h-full flex-col gap-6 px-5 py-24 md:w-max md:flex-row md:items-center md:gap-8 md:px-10 md:py-0"
      >
        {/* Intro panel */}
        <div className="flex shrink-0 flex-col justify-center md:w-[38vw] md:pr-10">
          <div className="mb-8 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
            <span className="size-2 bg-magenta" /> Studio work
          </div>
          <h2 className="font-display text-[14vw] font-semibold leading-[0.88] tracking-[-0.05em] md:text-[7vw]">
            Work that <span className="font-serif font-normal italic text-sunset">rises.</span>
          </h2>
          <p className="mt-6 max-w-sm text-cream/60">
            Websites for brands and businesses, designed and built in-house. More launches are on the way.
          </p>
          <div className="mt-10 hidden h-px w-56 bg-cream/15 md:block">
            <div data-work-progress className="h-full origin-left scale-x-0" style={{ background: "var(--sunset-x)" }} />
          </div>
        </div>

        {projects.map((p) => (
          <ProjectCard
            key={p.title}
            p={p}
            className="shrink-0 md:w-[min(46vw,620px)]"
            frameClassName="aspect-[4/5] md:aspect-[5/6] md:h-[68vh] md:w-auto"
          />
        ))}

        {/* Closing CTA card */}
        <button
          data-card
          onClick={() => lenis?.scrollTo("#contact", { duration: 1.8 })}
          className="group relative flex shrink-0 flex-col justify-between overflow-hidden rounded-[28px] border border-dashed border-cream/25 p-8 text-left transition-colors hover:border-amber md:h-[68vh] md:w-[min(34vw,460px)]"
        >
          <span className="font-label text-[10px] uppercase tracking-widest text-cream/50">Slot {String(projects.length + 1).padStart(2, "0")} · Open</span>
          <span className="mt-16 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] md:mt-0 md:text-6xl">
            Your project
            <br />
            <span className="font-serif font-normal italic text-sunset">could be here.</span>
          </span>
          <span className="mt-10 inline-flex items-center gap-3 text-cream/80 md:mt-0">
            Start a conversation
            <span className="grid size-10 place-items-center rounded-full bg-cream text-ink transition-transform duration-500 group-hover:rotate-[-45deg]">
              →
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
