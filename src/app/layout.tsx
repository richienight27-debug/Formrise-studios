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

export const metadata: Metadata = {
  metadataBase: new URL("https://formrisestudios.com"), // PLACEHOLDER: your real domain
  title: `${site.name} | Design & Development Studio`,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    images: [asset("/images/poster.webp")],
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
