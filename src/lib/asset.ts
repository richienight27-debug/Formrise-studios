/**
 * The site is exported as static files. On GitHub Pages it lives under
 * /<repo-name>/, so every root-absolute path (images, hero frames) needs that
 * prefix. The deploy workflow sets it at build time; locally it's empty.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;
