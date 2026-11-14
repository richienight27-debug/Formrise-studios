/**
 * All editable copy for the site lives here.
 * Anything marked PLACEHOLDER is waiting on real content.
 */

export const site = {
  name: "Formrise Studios",
  short: "Formrise",
  tagline: "We shape brands that rise.",
  description:
    "Formrise Studios is an independent design & development studio crafting brand identities, websites and digital experiences that rise above the noise.",
  email: "hello@formrisestudios.com", // PLACEHOLDER: swap for your real inbox
  location: "Dehradun, Uttarakhand",
  // IANA timezone for the footer studio clock, e.g. "Asia/Kolkata". Leave undefined to show the visitor's local time.
  timezone: "Asia/Kolkata" as string | undefined,
  socials: [
    { label: "Instagram", href: "#" }, // PLACEHOLDER links
    { label: "LinkedIn", href: "#" },
    { label: "Behance", href: "#" },
    { label: "X / Twitter", href: "#" },
  ],
};

export const nav = [
  { id: "services", label: "Services" },
  { id: "work", label: "Work" },
  { id: "portfolios", label: "Portfolios" },
  { id: "process", label: "Process" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export const marquee = [
  "Brand Identity",
  "Web Design",
  "Creative Development",
  "Motion",
  "3D & WebGL",
  "E-commerce",
  "Art Direction",
];

export const services = [
  {
    title: "Brand Identity",
    body: "Names, marks, type and colour systems built to scale from a favicon to a billboard.",
    tags: ["Strategy", "Logo", "Visual Systems", "Guidelines"],
  },
  {
    title: "Web Design",
    body: "Editorial layouts and interfaces that feel considered at every breakpoint.",
    tags: ["UI / UX", "Wireframes", "Design Systems", "Prototyping"],
  },
  {
    title: "Creative Development",
    body: "Next.js builds with motion, WebGL and performance treated as first-class features.",
    tags: ["Next.js", "GSAP", "WebGL", "CMS"],
  },
  {
    title: "Motion & 3D",
    body: "Scroll stories, micro-interactions and product renders that make people stop scrolling.",
    tags: ["Animation", "Three.js", "Video", "Interaction"],
  },
  {
    title: "Launch & Growth",
    body: "SEO foundations, analytics and iteration after launch so the work keeps rising.",
    tags: ["SEO", "Analytics", "A/B Testing", "Care Plans"],
  },
];

export type Project = {
  title: string;
  category: string;
  /** shown top-right of the title; omit if unknown */
  year?: string;
  hue: "sunrise" | "dusk" | "neon" | "midnight";
  /** screenshot shown in a browser frame; omit for a placeholder card */
  image?: string;
  /** short line under the title */
  note?: string;
  /** badges on the card */
  tags?: string[];
  /** live link, once the site is published */
  url?: string;
};

/** Main studio work: client & brand websites. Add new projects here as they launch. */
export const projects: Project[] = [
  {
    title: "Flowell Group",
    category: "Corporate website · Offshore oil, gas & marine",
    hue: "midnight",
    image: "/images/work/flowell.webp",
    url: "https://www.flowellgroup.org/",
    note: "Website for Flowell, an engineering procurement company serving offshore oil, gas and marine since 2011, based in Baku.",
    tags: ["Client website", "Next.js"],
  },
];

/** Personal portfolios built for friends, kept apart from the main studio work. */
export const portfolios: Project[] = [
  {
    title: "Abie Thomas Marcus",
    category: "Car photography",
    year: "2026",
    hue: "dusk",
    image: "/images/work/abie.webp",
    note: "A simple HTML & CSS project: no frameworks, just hand-written markup and styles.",
    tags: ["Personal portfolio", "HTML & CSS"],
  },
  {
    title: "Susy P Verghese",
    category: "Student & sketcher",
    year: "2026",
    hue: "neon",
    image: "/images/work/susy-next.webp",
    // no link yet: the live GitHub Pages site is the older HTML version; add `url` once the Next.js build is published
    note: "Built with Next.js and TypeScript, with GSAP and Lenis for the motion and smooth scrolling.",
    tags: ["Personal portfolio", "Next.js · TypeScript"],
  },
];

export const process = [
  {
    step: "01",
    title: "Discover",
    body: "We dig into your business, audience and competitors until we can explain your brand better than a pitch deck can.",
    points: ["Workshops", "Audit", "Research"],
  },
  {
    step: "02",
    title: "Define",
    body: "Positioning, voice and a creative direction everyone can rally behind, before a single pixel is pushed.",
    points: ["Strategy", "Moodboards", "Sitemap"],
  },
  {
    step: "03",
    title: "Design",
    body: "Identity and interface design, iterated in the open with prototypes you can actually click and feel.",
    points: ["Identity", "UI", "Prototypes"],
  },
  {
    step: "04",
    title: "Develop & Launch",
    body: "Hand-built, fast and accessible. We ship, measure, and keep refining after launch day.",
    points: ["Build", "QA", "Launch"],
  },
];

export const founder = {
  name: "Richie", // PLACEHOLDER: add your full name
  role: "Founder & Creative Director",
  photo: "/images/founder.webp",
  caption: "Dehradun → Trivandrum → everywhere",
  quote: "Good design isn't decoration. It's the moment a brand finally sounds like itself.",
  bio: [
    "Formrise started with a simple frustration: too many great businesses hidden behind forgettable websites. I set up the studio to close that gap, pairing sharp brand thinking with obsessive craft in code and motion.",
    "I'm currently studying business at ASB Trivandrum, so every project is shaped by both sides: what looks right, and what actually grows the business. Design, development and strategy stay in one head, so nothing gets lost in hand-off.",
  ],
  facts: [
    { k: "Based in", v: "Dehradun, Uttarakhand" },
    { k: "Studying", v: "ASB, Trivandrum" },
    { k: "Focus", v: "Brand · Web · Motion" },
    { k: "Currently", v: "Booking projects for 2027" },
  ],
};

export const principles = [
  { title: "Craft over templates", body: "Every pixel is chosen, not defaulted." },
  { title: "Motion with meaning", body: "Animation that guides, never distracts." },
  { title: "Built to perform", body: "Beautiful is pointless if it's slow." },
];
