"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/content/site";
import { asset } from "@/lib/asset";
import { useLenis } from "./SmoothScroll";

gsap.registerPlugin(ScrollTrigger, CustomEase);
// quick start, long soft landing
if (typeof window !== "undefined" && !CustomEase.get("silk")) CustomEase.create("silk", "0.7, 0, 0.15, 1");

const STACK_Y = 7; // % of card height each card behind sits lower
const STACK_SCALE = 0.07; // how much smaller each card behind is
const VISIBLE_DEPTH = 4;
const STEP = 1; // timeline units per card change
const HOLD = 0.5; // pause on each card so it can be read
const LEAD = 0.3; // pause before the first change

const stackState = (k: number) => ({
  yPercent: k * STACK_Y,
  scale: 1 - k * STACK_SCALE,
  autoAlpha: k < VISIBLE_DEPTH ? 1 : 0,
});
const shadeFor = (k: number) => Math.min(k * 0.28, 0.8);
const pad = (n: number) => String(n).padStart(2, "0");
const host = (url?: string) => (url ? new URL(url).host.replace(/^www\./, "") : "");

type Slide =
  | { kind: "project"; p: Project }
  | { kind: "cta" };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Projects as a deck of browser-window cards. The stage pins; each scroll step
 * lifts the top card up and away with a tilt while the deck behind steps forward
 * and the copy on the left rolls over to the next project. Click a card to open
 * the full screenshot.
 */
export default function ProjectDeck({ items, cta = false }: { items: Project[]; cta?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const slides: Slide[] = [...items.map((p) => ({ kind: "project" as const, p })), ...(cta ? [{ kind: "cta" as const }] : [])];
  const n = slides.length;
  const viewable = items.filter((p) => p.image);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<number | null>(null); // index into `viewable`

  useGSAP(
    (_ctx, contextSafe) => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-deck-card]");
      const shades = gsap.utils.toArray<HTMLElement>("[data-deck-shade]");
      const texts = gsap.utils.toArray<HTMLElement>("[data-deck-text]");
      const reduce = reduced();

      cards.forEach((card, i) => {
        gsap.set(card, { ...stackState(i), transformOrigin: "50% 50%" });
        gsap.set(shades[i], { opacity: shadeFor(i) });
      });
      texts.forEach((t, i) => {
        if (i > 0) gsap.set(t.querySelectorAll("[data-wt]"), reduce ? { opacity: 0 } : { yPercent: 115 });
      });

      // intro: the deck rises in when it scrolls into view. It moves a wrapper, not the
      // cards, so it never fights the scroll timeline that owns the cards' transforms.
      if (!reduce) {
        gsap.from("[data-deck-intro]", {
          y: 140,
          rotate: 4,
          opacity: 0,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: stage.current, start: "top 75%" },
        });
      }

      if (n > 1) {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage.current,
            start: "top top",
            end: () => `+=${(n - 1) * window.innerHeight * 0.95}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
          onUpdate() {
            // which project's copy is showing (switches halfway through each change)
            const t = this.time() - LEAD + STEP * 0.5;
            setCurrent(gsap.utils.clamp(0, n - 1, Math.floor(t / (STEP + HOLD))));
          },
        });

        tl.to({}, { duration: LEAD });

        for (let i = 0; i < n - 1; i++) {
          const at = tl.duration();
          const dir = i % 2 === 0 ? 1 : -1;
          const outgoing = texts[i].querySelectorAll("[data-wt]");
          const incoming = texts[i + 1].querySelectorAll("[data-wt]");

          if (reduce) {
            tl.to(cards[i], { autoAlpha: 0, duration: STEP }, at)
              .to(outgoing, { opacity: 0, duration: STEP * 0.4 }, at)
              .to(incoming, { opacity: 1, duration: STEP * 0.4 }, at + STEP * 0.5);
          } else {
            // the top card lifts off the deck, tilting as it goes
            tl.to(cards[i], { y: () => -window.innerHeight * 1.15, x: dir * 70, rotate: dir * 9, ease: "power2.in", duration: STEP }, at)
              .to(outgoing, { yPercent: -115, stagger: 0.05, duration: STEP * 0.42, ease: "power2.in" }, at)
              .to(incoming, { yPercent: 0, stagger: 0.05, duration: STEP * 0.5, ease: "power3.out" }, at + STEP * 0.42);
          }

          // everything behind steps one place forward
          for (let j = i + 1; j < n; j++) {
            const k = j - i - 1;
            tl.to(cards[j], { ...stackState(k), duration: STEP * 0.8, ease: "power2.inOut" }, at + STEP * 0.2).to(
              shades[j],
              { opacity: shadeFor(k), duration: STEP * 0.8 },
              at + STEP * 0.2,
            );
          }

          tl.to("[data-count-roll]", { yPercent: (-100 * (i + 1)) / n, duration: STEP * 0.6, ease: "power2.inOut" }, at + STEP * 0.25);
          tl.to({}, { duration: HOLD });
        }

        tl.fromTo("[data-deck-progress]", { scaleX: 1 / n }, { scaleX: 1, duration: tl.duration() }, 0);
      }

      // the deck leans toward the pointer
      if (reduce || !contextSafe || !window.matchMedia("(pointer: fine)").matches) return;
      const tilt = root.current?.querySelector<HTMLElement>("[data-deck-tilt]");
      if (!tilt) return;
      const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3" });
      const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3" });
      const move = contextSafe((e: PointerEvent) => {
        const r = tilt.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - 0.5) * -10);
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      });
      const leave = contextSafe(() => {
        rx(0);
        ry(0);
      });
      tilt.addEventListener("pointermove", move);
      tilt.addEventListener("pointerleave", leave);
      return () => {
        tilt.removeEventListener("pointermove", move);
        tilt.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  const goContact = () => lenis?.scrollTo("#contact", { duration: 1.8 });

  return (
    <div ref={root}>
      <div
        ref={stage}
        className="relative grid h-svh grid-rows-[auto_1fr] items-center gap-4 overflow-hidden px-5 pb-6 pt-20 md:grid-cols-2 md:grid-rows-1 md:gap-[4vw] md:px-10 md:pb-8 md:pt-24"
      >
        {/* Copy */}
        <div className="grid w-full max-w-xl gap-3 md:h-[min(72svh,640px)] md:grid-rows-[auto_1fr_auto] md:justify-self-center">
          <div className="flex items-start gap-2 font-display text-4xl font-semibold leading-none tracking-[-0.05em] md:text-[clamp(3rem,6vw,6rem)]" aria-hidden>
            <span className="inline-block h-[1em] overflow-clip">
              <span data-count-roll className="flex flex-col">
                {slides.map((_, i) => (
                  <span key={i} className="block h-[1em]">
                    {pad(i + 1)}
                  </span>
                ))}
              </span>
            </span>
            <span className="mt-[0.8em] font-label text-xs font-normal tracking-widest text-cream/50">/ {pad(n)}</span>
          </div>

          <div className="relative min-h-[11rem] md:min-h-0">
            {slides.map((s, i) => (
              <article
                key={i}
                data-deck-text
                className={`absolute inset-0 flex flex-col justify-start gap-3 md:justify-center md:gap-4 ${
                  i === current ? "" : "pointer-events-none"
                }`}
                aria-hidden={i !== current}
              >
                {s.kind === "project" ? (
                  <>
                    <p className="line-mask font-label text-[10px] uppercase tracking-widest text-amber md:text-xs">
                      <span data-wt className="block">
                        {s.p.category}
                        {s.p.year ? ` · ${s.p.year}` : ""}
                      </span>
                    </p>
                    <h3 className="line-mask font-display text-[clamp(2rem,9vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.045em] md:text-[clamp(2.6rem,5vw,5.2rem)]">
                      <span data-wt className="block">{s.p.title}</span>
                    </h3>
                    {s.p.note && (
                      <p className="line-mask max-w-md text-sm text-cream/70 md:text-lg">
                        <span data-wt className="block">{s.p.note}</span>
                      </p>
                    )}
                    <ul className="hidden flex-wrap gap-2 md:flex">
                      {(s.p.tags ?? []).map((t) => (
                        <li key={t} className="line-mask inline-block">
                          <span data-wt className="block rounded-full border border-cream/20 px-3 py-1 text-sm text-cream/80">
                            {t}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {s.p.url && (
                      <span className="line-mask">
                        <a
                          data-wt
                          href={s.p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-sm text-amber md:text-base"
                        >
                          Visit {host(s.p.url)}
                          <span className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                        </a>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <p className="line-mask font-label text-[10px] uppercase tracking-widest text-amber md:text-xs">
                      <span data-wt className="block">Slot {pad(n)} · Open</span>
                    </p>
                    <h3 className="line-mask font-display text-[clamp(2rem,9vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.045em] md:text-[clamp(2.6rem,5vw,5.2rem)]">
                      <span data-wt className="block">
                        Your project <span className="font-serif font-normal italic text-sunset">next.</span>
                      </span>
                    </h3>
                    <p className="line-mask max-w-md text-sm text-cream/70 md:text-lg">
                      <span data-wt className="block">This spot is waiting for the next brand that wants to rise. Tell us what you&apos;re building.</span>
                    </p>
                    <span className="line-mask">
                      <button data-wt onClick={goContact} className="group inline-flex items-center gap-3 text-sm text-cream md:text-base">
                        Start a conversation
                        <span className="grid size-9 place-items-center rounded-full bg-cream text-ink transition-transform duration-500 group-hover:rotate-[-45deg]">
                          →
                        </span>
                      </button>
                    </span>
                  </>
                )}
              </article>
            ))}
          </div>

          <div className="hidden h-0.5 overflow-hidden bg-cream/15 md:block" aria-hidden>
            <span data-deck-progress className="block h-full origin-left" style={{ background: "var(--sunset-x)", transform: `scaleX(${1 / n})` }} />
          </div>
        </div>

        {/* Deck */}
        <div data-deck-intro className="grid h-full place-items-center">
          <div data-deck-tilt className="relative aspect-[16/11] w-[min(88vw,620px)] md:w-[min(42vw,620px)]" style={{ transform: "perspective(1200px)" }}>
            {slides.map((s, i) => {
              const vIndex = s.kind === "project" ? viewable.indexOf(s.p) : -1;
              const clickable = s.kind === "cta" || vIndex >= 0;
              return (
                <button
                  key={i}
                  data-deck-card
                  type="button"
                  disabled={!clickable}
                  onClick={() => (s.kind === "cta" ? goContact() : setOpen(vIndex))}
                  aria-label={s.kind === "cta" ? "Start a conversation" : `View ${s.p.title} full size`}
                  className="group absolute inset-0 block overflow-hidden rounded-2xl bg-ink text-left shadow-[0_40px_70px_-30px_rgba(0,0,0,.85),inset_0_0_0_1px_rgba(255,243,230,.08)] will-change-transform"
                  style={{ zIndex: n - i }}
                >
                  {s.kind === "project" ? (
                    <>
                      {/* absolutely placed: a <button> vertically centres in-flow content */}
                      <span className="absolute inset-x-0 top-0 z-[1] flex h-[7%] min-h-6 items-center gap-1.5 border-b border-cream/10 bg-night px-3" aria-hidden>
                        <span className="size-2 rounded-full bg-coral/80" />
                        <span className="size-2 rounded-full bg-amber/80" />
                        <span className="size-2 rounded-full bg-cream/30" />
                        <span className="ml-3 truncate font-label text-[9px] tracking-wider text-cream/40">{host(s.p.url) || s.p.title}</span>
                      </span>
                      <span className="absolute inset-x-0 bottom-0 top-[7%] overflow-hidden">
                        {s.p.image && (
                          <Image
                            src={asset(s.p.image)}
                            alt={`Homepage of ${s.p.title}`}
                            fill
                            sizes="(max-width: 768px) 88vw, 42vw"
                            className="object-cover object-top transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                          />
                        )}
                      </span>
                      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" aria-hidden />
                      <span className="absolute bottom-4 left-5 font-display text-xl font-semibold tracking-[-0.03em] text-cream md:text-3xl" aria-hidden>
                        {s.p.title}
                      </span>
                      <span className="absolute right-4 top-[calc(7%+12px)] rounded-full bg-ink/55 px-2.5 py-1 font-label text-[10px] text-cream backdrop-blur" aria-hidden>
                        {pad(i + 1)}
                      </span>
                      <span className="absolute bottom-4 right-4 translate-y-2 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-ink opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden>
                        View full size ↗
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-0" style={{ background: "linear-gradient(160deg,#ffd27a 0%,#ff6a3d 45%,#ff3d8b 75%,#6c2bd9 110%)" }} aria-hidden />
                      <span className="absolute inset-x-0 top-[22%] flex justify-center" aria-hidden>
                        <span
                          className="block aspect-square w-[26%] rounded-full transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-3"
                          style={{
                            background: "radial-gradient(circle at 50% 45%, #fffef6 0%, #fff1c9 40%, rgba(255,214,140,.6) 70%, rgba(255,214,140,0) 100%)",
                            boxShadow: "0 0 80px 30px rgba(255,236,200,.4)",
                          }}
                        />
                      </span>
                      <span className="absolute inset-x-0 top-[60%] h-px bg-cream/40" aria-hidden />
                      <span className="absolute bottom-5 left-5 font-display text-2xl font-semibold leading-none tracking-[-0.03em] text-ink md:text-4xl" aria-hidden>
                        Your project <span className="font-serif font-normal italic">here.</span>
                      </span>
                      <span className="absolute right-4 top-4 rounded-full bg-ink/40 px-2.5 py-1 font-label text-[10px] text-cream backdrop-blur" aria-hidden>
                        {pad(i + 1)}
                      </span>
                    </>
                  )}
                  <span data-deck-shade className="pointer-events-none absolute inset-0 bg-ink" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Lightbox items={viewable} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </div>
  );
}

/** Full-size screenshot view. Esc closes, arrow keys step through, click outside closes. */
function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: Project[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const lenis = useLenis();
  const isOpen = index !== null;
  const [shown, setShown] = useState(0); // keep the last item rendered while closing
  if (index !== null && index !== shown) setShown(index);
  const p = items[shown];
  const n = items.length;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reduce = reduced();
      if (isOpen) {
        wasOpen.current = true;
        returnFocus.current = document.activeElement as HTMLElement;
        lenis?.stop();
        gsap
          .timeline()
          .set(el, { autoAlpha: 1 })
          .fromTo("[data-lb-bg]", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" })
          .fromTo(
            "[data-lb-frame]",
            reduce ? { opacity: 0 } : { clipPath: "inset(18% 18% 18% 18% round 28px)", scale: 1.04 },
            reduce ? { opacity: 1, duration: 0.3 } : { clipPath: "inset(0% 0% 0% 0% round 12px)", scale: 1, duration: 1.1, ease: "silk" },
            0.05,
          )
          .fromTo("[data-lb-ui] > *", { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "expo.out" }, 0.45);
        closeBtn.current?.focus({ preventScroll: true });
      } else if (wasOpen.current) {
        wasOpen.current = false;
        gsap.to(el, { autoAlpha: 0, duration: 0.35 });
        lenis?.start();
        returnFocus.current?.focus({ preventScroll: true });
      }
    },
    { scope: root, dependencies: [isOpen] },
  );

  // swapping between screenshots while open
  useGSAP(
    () => {
      if (!isOpen || reduced()) return;
      gsap.fromTo("[data-lb-img]", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.7, ease: "expo.out" });
    },
    { scope: root, dependencies: [shown] },
  );

  const step = useCallback((d: number) => onChange((shown + d + n) % n), [shown, n, onChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && n > 1) step(1);
      if (e.key === "ArrowLeft" && n > 1) step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, n, onClose, step]);

  if (!p) return null;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className="invisible fixed inset-0 z-[95] grid place-items-center px-5 pb-28 pt-20 opacity-0 md:px-10"
    >
      <div data-lb-bg className="absolute inset-0 bg-ink/95 backdrop-blur-md" onClick={onClose} />
      <div data-lb-frame className="relative max-h-full max-w-full overflow-hidden rounded-xl shadow-[0_40px_120px_-30px_rgba(255,61,139,.35)]">
        {p.image && (
          <Image
            key={p.title}
            data-lb-img
            src={asset(p.image)}
            alt={`Homepage of ${p.title}`}
            width={1440}
            height={900}
            sizes="92vw"
            className="h-auto max-h-[calc(100svh-210px)] w-auto max-w-[min(92vw,1280px)] object-contain"
          />
        )}
      </div>
      <div data-lb-ui className="absolute inset-x-5 bottom-7 flex flex-wrap items-end justify-between gap-4 md:inset-x-10">
        <div className="grid gap-1">
          <span className="font-label text-[10px] uppercase tracking-widest text-cream/50 md:text-xs">
            {pad(shown + 1)} / {pad(n)} · {p.category}
          </span>
          <strong className="font-display text-2xl font-semibold tracking-[-0.035em] md:text-4xl">{p.title}</strong>
        </div>
        <div className="flex gap-2">
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-12 place-items-center rounded-full px-5 text-sm font-medium text-ink"
              style={{ background: "var(--sunset-x)" }}
            >
              Visit site ↗
            </a>
          )}
          {n > 1 && (
            <>
              <button onClick={() => step(-1)} aria-label="Previous project" className="h-12 min-w-12 rounded-full px-4 shadow-[inset_0_0_0_1px_rgba(255,243,230,.25)] transition-colors hover:bg-cream hover:text-ink">
                ←
              </button>
              <button onClick={() => step(1)} aria-label="Next project" className="h-12 min-w-12 rounded-full px-4 shadow-[inset_0_0_0_1px_rgba(255,243,230,.25)] transition-colors hover:bg-cream hover:text-ink">
                →
              </button>
            </>
          )}
          <button ref={closeBtn} onClick={onClose} className="h-12 rounded-full px-5 shadow-[inset_0_0_0_1px_rgba(255,243,230,.25)] transition-colors hover:bg-cream hover:text-ink">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
