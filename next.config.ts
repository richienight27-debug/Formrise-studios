import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>/. The deploy workflow passes that
// prefix in PAGES_BASE_PATH; local builds leave it empty and serve from the root.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fully static site: `next build` writes plain HTML/CSS/JS to ./out
  output: "export",
  basePath,
  trailingSlash: true,
  // no image server on static hosting
  images: { unoptimized: true },
  // expose the prefix to client code (see src/lib/asset.ts)
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
