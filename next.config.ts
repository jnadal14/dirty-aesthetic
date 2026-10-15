import type { NextConfig } from 'next'

// Static export for GitHub Pages. With trailingSlash off, every route is
// written as <route>.html (out/music.html), so the old /music.html links in
// ads, bios and search results keep resolving, and Pages serves /music too.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  turbopack: {
    root: process.cwd(),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
