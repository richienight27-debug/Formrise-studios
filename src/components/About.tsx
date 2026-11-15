"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { founder } from "@/content/site";
import { asset } from "@/lib/asset";
import TypeLabel from "./TypeLabel";

gsap.registerPlugin(ScrollTrigger);

function Badge() {
  const text = "Founder • Formrise Studios • Est. 2026 • ";
  return (
    <div className="relative size-28 md:size-36">
      <svg viewBox="0 0 120 120" className="absolute inset-0 animate-[spin-slow_18s_linear_infinite]" aria-hidden>
        <defs>
          <path id="badge-circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1 -92 0" />
        </defs>
        <text className="fill-cream font-label text-[9.4px] uppercase tracking-[0.12em]">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] grid place-items-center rounded-full bg-ink">
        <span
          className="block size-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 45%, #fffef6 0%, #ffd98a 45%, #ff9a45 85%, #ff6a3d 100%)",
            boxShadow: "0 0 18px 4px rgba(255,170,90,.55)",
          }}
        />
      </div>
    </div>
  );
}

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Curtain reveal of the portrait, then parallax drift
      gsap.fromTo(
        "[data-photo-wrap]",
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.6,
          ease: "expo.inOut",
          scrollTrigger: { trigger: "[data-photo-wrap]", start: "top 80%" },
        },
      );
      gsap.fromTo(
        "[data-photo]",
        { yPercent: -8, scale: 1.15 },
        {
          yPercent: 8,
          scale: 1.05,
          ease: "none",
          scrollTrigger: { trigger: "[data-photo-wrap]", start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      gsap.from("[data-ab-title] .w", {
        yPercent: 110,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-ab-title]", start: "top 85%" },
      });
      gsap.from("[data-ab-fade]", {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-ab-copy]", start: "top 80%" },
      });
    },
    { scope: root },
  );

  return (
    <section id="about" ref={root} className="relative px-5 py-24 md:px-10 md:py-40">
      <div className="mb-10 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/50 md:mb-16 md:text-xs">
        <span className="size-2 bg-violet" /> <TypeLabel text="The founder" />
      </div>

      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        {/* Portrait */}
        <div className="relative md:col-span-5">
          <div
            data-photo-wrap
            className="relative aspect-[3/4] overflow-hidden rounded-[32px]"
            style={{ background: "linear-gradient(180deg,#ffe4b8 0%,#ffc98f 45%,#ff9f73 100%)" }}
          >
            {/* the white studio backdrop multiplies into the sunset gradient */}
            <div data-photo className="absolute inset-0 mix-blend-multiply">
              <Image
                src={asset(founder.photo)}
                alt={`${founder.name}, ${founder.role} of Formrise Studios`}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[50%_75%]"
                priority={false}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-ink">
              <span className="font-label text-[10px] uppercase tracking-widest">{founder.caption}</span>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-3 md:-bottom-14 md:-right-12">
            <Badge />
          </div>
        </div>

        {/* Copy */}
        <div data-ab-copy className="md:col-span-7 md:pl-6">
          <h2 data-ab-title className="font-display text-[15vw] font-semibold leading-[0.86] tracking-[-0.05em] md:text-[7.5vw]">
            <span className="line-mask"><span className="w block">Hi, I&apos;m</span></span>
            <span className="line-mask">
              <span className="w block pr-[0.06em] font-serif font-normal italic text-sunset">{founder.name}.</span>
            </span>
          </h2>
          <p data-ab-fade className="mt-6 font-label text-xs uppercase tracking-widest text-amber">
            {founder.role}
          </p>

          <div className="mt-10 space-y-5 text-lg leading-relaxed text-cream/75 md:text-xl">
            {founder.bio.map((b, i) => (
              <p key={i} data-ab-fade>
                {b}
              </p>
            ))}
          </div>

          <blockquote data-ab-fade className="mt-12 border-l-2 border-magenta pl-6 font-serif text-3xl italic leading-tight md:text-4xl">
            &ldquo;{founder.quote}&rdquo;
          </blockquote>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-cream/15 pt-8">
            {founder.facts.map((f) => (
              <div key={f.k} data-ab-fade>
                <dt className="font-label text-[10px] uppercase tracking-widest text-cream/40">{f.k}</dt>
                <dd className="mt-2 font-display text-lg font-medium md:text-xl">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
