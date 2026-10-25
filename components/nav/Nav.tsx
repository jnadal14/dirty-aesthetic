'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useLenis } from 'lenis/react'
import { useRef, useState } from 'react'
import { nav } from '@/lib/site'
import { nextShow } from '@/lib/data'
import { SNAP } from '@/lib/motion'

const ticketLong = nextShow ? nextShow.ticketLabel || nextShow.title || nextShow.venue : ''
const ticketShort = nextShow ? nextShow.ticketLabelShort || ticketLong : ''
const SLACK = 12

/**
 * Splat logo with the next-show ticket pill beside it on the left, text links
 * on the right, all on one row at every width (no hamburger).
 * Hides while scrolling down and returns on a scroll up.
 */
export default function Nav() {
  // /music, /music.html and /music/ are all the same page (and /index.html is /).
  const path = (usePathname() || '/').replace(/(\/index)?(\.html)?\/?$/, '') || '/'
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const lenis = useLenis()
  const { scrollY } = useScroll()
  // Where the last direction change was decided. Moves smaller than SLACK are
  // ignored: a phone's collapsing address bar and the end of a fling nudge
  // the scroll position back and forth, which used to flick the bar in and out.
  const anchor = useRef(0)

  useMotionValueEvent(scrollY, 'change', y => {
    setSolid(y > 40)
    if (y < 160) { anchor.current = y; setHidden(false); return }
    const d = y - anchor.current
    if (Math.abs(d) < SLACK) return
    anchor.current = y
    setHidden(d > 0)
  })

  const active = nav.find(n => path === n.href)?.href ?? null
  const underline = hover ?? active

  // The pill sells the next show, so it goes where that show is sold. A date
  // with no ticket link yet falls back to the homepage section; on the
  // homepage itself that's a smooth scroll (Lenis's anchors do it on desktop).
  const ticketProps = nextShow?.link
    ? { href: nextShow.link, target: '_blank', rel: 'noopener' }
    : {
        href: '/#upcoming-section',
        onClick: (e: React.MouseEvent) => {
          const el = path === '/' && !lenis ? document.getElementById('upcoming-section') : null
          if (!el) return
          e.preventDefault()
          el.scrollIntoView({ behavior: 'smooth' })
        },
      }

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]"
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="nav-scrim border-b border-transparent">
        {/* The solid ground fades in as a layer of its own. An opacity transition
            stays on the compositor; the old background/border-color one
            repainted the bar on every frame of it. */}
        <div aria-hidden className={`absolute inset-x-0 top-0 -bottom-px -z-1 border-b border-bone/8 bg-umber/70 transition-opacity duration-500 ${solid ? 'opacity-100' : 'opacity-0'}`} />
        <div className="flex items-center justify-between gap-3 py-2 pl-[max(clamp(12px,4vw,32px),env(safe-area-inset-left))] pr-[max(clamp(12px,4vw,32px),env(safe-area-inset-right))] md:py-4 short:py-1.5">
          <div className="flex min-w-0 items-center gap-[clamp(6px,2vw,12px)]">
            <Link href="/" aria-label="Dirty Aesthetic home" className="shrink-0">
              <motion.img
                src="/assets/images/logos/da-splat.png" alt="" width={120} height={120}
                className="h-8 w-auto md:h-12"
                whileHover={{ rotate: -10, scale: 1.08 }} transition={SNAP}
              />
            </Link>
            {nextShow && (
              <a {...ticketProps} className="ticket-pill">
                <span className="hidden sm:inline">{ticketLong}</span>
                <span className="sm:hidden">{ticketShort}</span>
              </a>
            )}
          </div>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-[clamp(9px,2.8vw,16px)] md:gap-6" onMouseLeave={() => setHover(null)}>
              {nav.map(item => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHover(item.href)}
                    aria-current={active === item.href ? 'page' : undefined}
                    className="block whitespace-nowrap py-2 text-[clamp(.8rem,3.7vw,1.05rem)] tracking-wide text-bone/85 [text-shadow:0_1px_10px_rgba(0,0,0,.65)] transition-colors hover:text-bone aria-[current=page]:text-bone md:text-[1.2rem] short:py-1"
                  >
                    {item.label}
                  </Link>
                  {underline === item.href && (
                    <motion.span layoutId="nav-underline" className="absolute inset-x-0 bottom-1 h-0.5 bg-accent" transition={SNAP} />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
