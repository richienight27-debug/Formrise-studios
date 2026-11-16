import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import SmoothScroll from "@/components/SmoothScroll";
import DynamicIsland from "@/components/DynamicIsland";
import Preloader from "@/components/Preloader";
import GradientBackground from "@/components/GradientBackground";
import frames from "@/lib/frames.json";
import { asset } from "@/lib/asset";

// Archivo is variable on weight AND width: wide for headlines, and the preloader
// wordmark animates both axes in response to the pointer.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

// Absolute address used for link previews (WhatsApp, Instagram, X…). SITE_URL wins if set
// (the GitHub Pages workflow sets it); on Netlify, URL is the site's main address and follows
// a custom domain once one is added; otherwise fall back to the Netlify subdomain.
// Preview image paths stay plain: Next.js appends them to this URL, which already
// carries the GitHub Pages /<repo> prefix when there is one.
const siteUrl = process.env.SITE_URL || process.env.URL || "https://formrisestudios.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${site.name} | Design & Development Studio`,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: "./",
    siteName: site.name,
    type: "website",
    images: [{ url: "/images/poster.webp", width: 1280, height: 718, alt: "Formrise Studios: a sunset sky over clouds" }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/images/poster.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0714",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`is-loading ${archivo.variable} ${fraunces.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href={asset(`/images/poster.webp?v=${frames.v}`)} />
      </head>
      <body>
        <GradientBackground />
        <SmoothScroll>
          <Preloader />
          <DynamicIsland />
          {children}
        </SmoothScroll>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
