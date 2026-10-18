'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

/**
 * The layout's footer, on every page but the homepage: there it is rendered
 * inside the contact section (app/page.tsx) so the section's photo runs on
 * behind it instead of stopping at a black band.
 */
export default function LayoutFooter() {
  // /, /index.html, /music.html and /music/ normalize like the nav does.
  const path = (usePathname() || '/').replace(/(\/index)?(\.html)?\/?$/, '') || '/'
  return path === '/' ? null : <Footer />
}
