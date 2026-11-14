import Image from "next/image";
import type { Project } from "@/content/site";
import { asset } from "@/lib/asset";

const HUES: Record<Project["hue"], string> = {
  sunrise: "linear-gradient(160deg,#ffd27a 0%,#ff6a3d 55%,#ff3d8b 100%)",
  dusk: "linear-gradient(160deg,#ff6a3d 0%,#ff3d8b 50%,#6c2bd9 100%)",
  neon: "linear-gradient(160deg,#2a1240 0%,#6c2bd9 45%,#3fe8ff 120%)",
  midnight: "linear-gradient(160deg,#120c26 0%,#2a1240 50%,#ff3d8b 140%)",
};

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

/**
 * One project card, shared by the studio-work gallery and the personal-portfolio grid.
 * With an `image` it shows the site's homepage in a browser frame; without one it's a placeholder.
 * `frameClassName` sets the card's size/aspect for each layout.
 */
export default function ProjectCard({
  p,
  className = "",
  frameClassName = "",
}: {
  p: Project;
  className?: string;
  frameClassName?: string;
}) {
  return (
    <article data-card className={`group relative ${className}`}>
      <div className={`relative overflow-hidden rounded-[28px] ${frameClassName}`}>
        {/* background layer (Work drives a horizontal parallax on data-card-inner) */}
        <div data-card-inner className="absolute -inset-x-[15%] inset-y-0">
          <div
            className={`absolute inset-0 transition-transform duration-[1.2s] ${EASE} group-hover:scale-[1.06]`}
            style={{ background: HUES[p.hue] }}
          >
            {!p.image && (
              <>
                <div className="absolute inset-x-0 top-[30%] flex justify-center" aria-hidden>
                  <span
                    className={`block aspect-square w-[34%] rounded-full opacity-90 transition-transform duration-[1.2s] ${EASE} group-hover:-translate-y-4`}
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, #fffef6 0%, #fff1c9 40%, rgba(255,214,140,.6) 70%, rgba(255,214,140,0) 100%)",
                      boxShadow: "0 0 80px 30px rgba(255,236,200,.35)",
                    }}
                  />
                </div>
                <div className="absolute inset-x-0 top-[62%] h-px bg-cream/40" aria-hidden />
              </>
            )}
          </div>
        </div>

        {p.image && (
          // the site's homepage, framed in a little browser window
          <div className="absolute inset-x-[7%] top-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-ink shadow-[0_30px_60px_-20px_rgba(10,7,20,.7)] ring-1 ring-cream/15">
            <div className="flex items-center gap-1.5 border-b border-cream/10 bg-ink/90 px-3 py-2" aria-hidden>
              <span className="size-2 rounded-full bg-coral/80" />
              <span className="size-2 rounded-full bg-amber/80" />
              <span className="size-2 rounded-full bg-cream/30" />
            </div>
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={asset(p.image)}
                alt={`Homepage of ${p.title}`}
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                className={`object-cover object-top transition-transform duration-[1.2s] ${EASE} group-hover:scale-[1.04]`}
              />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex flex-wrap justify-between gap-2 p-5 font-label text-[10px] uppercase tracking-widest text-cream">
          {(p.tags ?? ["Placeholder", "Case study soon"]).map((t) => (
            <span key={t} className="rounded-full bg-ink/40 px-3 py-1.5 backdrop-blur">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{p.title}</h3>
        {p.year && <span className="font-label text-[10px] text-cream/50">{p.year}</span>}
      </div>
      <p className="mt-1 text-cream/50">{p.category}</p>
      {p.note && <p className="mt-3 max-w-md text-sm text-cream/70">{p.note}</p>}
      {p.url && (
        <>
          <span className="mt-4 inline-flex items-center gap-2 text-sm text-amber">
            Visit site
            <span className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
          </span>
          {/* the whole card is the link once a live URL is set in site.ts */}
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 rounded-[28px]"
            aria-label={`Visit ${p.title} (opens in a new tab)`}
          />
        </>
      )}
    </article>
  );
}
