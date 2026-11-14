"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { services, site } from "@/content/site";
import Magnetic from "./Magnetic";

gsap.registerPlugin(ScrollTrigger);

/** Closing CTA + a tiny inquiry builder that composes an email (no backend needed). */
export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      gsap.from("[data-ct-char]", {
        yPercent: 120,
        rotate: 8,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.025,
        scrollTrigger: { trigger: "[data-ct-title]", start: "top 85%" },
      });
      gsap.from("[data-ct-form] > *", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-ct-form]", start: "top 85%" },
      });
    },
    { scope: root },
  );

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const mailto = () => {
    const body = [
      `Hi Formrise,`,
      ``,
      msg || "I'd love to talk about a project.",
      ``,
      picked.length ? `Interested in: ${picked.join(", ")}` : "",
      ``,
      name ? `— ${name}` : "",
    ]
      .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
      .join("\n");
    const subject = `New project inquiry${name ? ` from ${name}` : ""}`;
    return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  const line1 = "Let's make";
  const line2 = "it rise.";

  return (
    <section id="contact" ref={root} className="relative isolate overflow-hidden px-5 pb-24 pt-32 md:px-10 md:pb-32 md:pt-48">

      <div className="mb-8 flex items-center gap-3 font-label text-[10px] uppercase tracking-widest text-cream/60 md:text-xs">
        <span className="size-2 animate-pulse bg-cyan" /> Booking projects for 2027
      </div>

      <h2 data-ct-title className="font-display text-[17vw] font-semibold leading-[0.84] tracking-[-0.055em] md:text-[12.5vw]">
        <span className="line-mask">
          {line1.split("").map((c, i) => (
            <span key={i} data-ct-char className="inline-block whitespace-pre">
              {c}
            </span>
          ))}
        </span>
        <span className="line-mask">
          {line2.split("").map((c, i) => (
            <span key={i} data-ct-char className="inline-block whitespace-pre pr-[0.02em] font-serif font-normal italic text-sunset">
              {c}
            </span>
          ))}
        </span>
      </h2>

      <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="max-w-xs text-lg text-cream/70">
            Tell us a little about what you&apos;re building. We reply within two working days.
          </p>
          <button
            onClick={copy}
            className="group mt-8 inline-flex items-center gap-3 font-display text-xl font-medium md:text-2xl"
          >
            <span className="relative">
              {site.email}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-amber transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
            </span>
            <span className="relative h-5 overflow-hidden font-label text-[10px] uppercase tracking-widest text-amber">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={copied ? "c" : "n"}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  exit={{ y: -20 }}
                  className="block leading-5"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </div>

        <form
          data-ct-form
          className="space-y-10 md:col-span-8"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = mailto();
          }}
        >
          <fieldset>
            <legend className="mb-4 font-label text-[10px] uppercase tracking-widest text-cream/50">I&apos;m interested in</legend>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const on = picked.includes(s.title);
                return (
                  <button
                    type="button"
                    key={s.title}
                    onClick={() => toggle(s.title)}
                    aria-pressed={on}
                    className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 md:px-5 md:text-base ${
                      on ? "border-transparent text-ink" : "border-cream/25 text-cream/80 hover:border-cream/60"
                    }`}
                    style={on ? { background: "var(--sunset-x)" } : undefined}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>
          </fieldset>


          <div className="grid gap-8 md:grid-cols-2">
            <label className="block">
              <span className="font-label text-[10px] uppercase tracking-widest text-cream/50">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-3 w-full border-b border-cream/25 bg-transparent pb-3 font-display text-2xl outline-none transition-colors placeholder:text-cream/25 focus:border-amber"
                placeholder="Jane Doe"
              />
            </label>
            <label className="block">
              <span className="font-label text-[10px] uppercase tracking-widest text-cream/50">About the project</span>
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="mt-3 w-full border-b border-cream/25 bg-transparent pb-3 font-display text-2xl outline-none transition-colors placeholder:text-cream/25 focus:border-amber"
                placeholder="A rebrand + new site…"
              />
            </label>
          </div>

          <div>
          <Magnetic>
            <button
              type="submit"
              className="group relative grid size-36 place-items-center overflow-hidden rounded-full font-display text-lg font-semibold text-ink md:size-44 md:text-xl"
              style={{ background: "var(--sunset-x)" }}
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-cream transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover:scale-y-100" />
              <span className="relative text-center leading-tight">
                Send
                <br />
                inquiry ↗
              </span>
            </button>
          </Magnetic>
          </div>
        </form>
      </div>
    </section>
  );
}
