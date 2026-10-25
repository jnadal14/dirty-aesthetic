'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

/**
 * The layout's footer, on every page but the homepage. It has no ground of its
 * own, so an inner page's fixed background (PageBackdrop's photo, or the plain
 * ground on the EPK and posters) shows through it. On the homepage it is
 * rendered inside the contact section instead (app/page.tsx), so that
 * section's photo runs on behind it.
 */
export default function LayoutFooter() {
  // /, /index.html, /music.html and /music/ normalize like the nav does.
  const path = (usePathname() || '/').replace(/(\/index)?(\.html)?\/?$/, '') || '/'
  return path === '/' ? null : <Footer />
}
