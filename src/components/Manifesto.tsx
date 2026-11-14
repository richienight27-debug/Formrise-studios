"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { principles } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

// *word* = serif-italic sunset accent
const TEXT =
  "Formrise is a studio for brands on the edge of their next chapter. We blend strategy, design and code into experiences that feel *warm* like a sunset and *sharp* like a pixel. No templates. No noise. Just work that rises.";

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-word]",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: "[data-para]", start: "top 78%", end: "bottom 45%", scrub: true },
        },
      );
      gsap.from("[data-principle]", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-principles]", start: "top 85%" },
      });
      gsap.from("[data-principle-line]", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-principles]", start: "top 85%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="intro" ref={root} className="relative px-5 py-28 md:px-10 md:py-44">
      <div className="mb-10 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
        <span className="size-2 bg-coral" /> The studio
      </div>
      <p
        data-para
        className="max-w-[18ch] font-display text-[9.5vw] font-semibold leading-[1.02] tracking-[-0.04em] md:max-w-[22ch] md:text-[5.4vw]"
      >
        {TEXT.split(" ").map((w, i) => {
          const accent = w.startsWith("*");
          const clean = w.replaceAll("*", "");
          return (
            <span key={i} data-word className={`inline-block pr-[0.24em] ${accent ? "font-serif font-normal italic text-sunset" : ""}`}>
              {clean}
            </span>
          );
        })}
      </p>

      <div data-principles className="mt-24 grid gap-10 md:mt-36 md:grid-cols-3 md:gap-8">
        {principles.map((p, i) => (
          <div key={p.title} data-principle>
            <div data-principle-line className="mb-6 h-px w-full bg-cream/20" />
            <div className="mb-4 font-label text-xs text-amber">0{i + 1}</div>
            <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{p.title}</h3>
            <p className="mt-2 text-cream/60">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
