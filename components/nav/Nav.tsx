'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { nav } from '@/lib/site'
import { nextShow } from '@/lib/data'
import { SNAP } from '@/lib/motion'

const ticketLong = nextShow ? nextShow.ticketLabel || nextShow.title || nextShow.venue : ''
const ticketShort = nextShow ? nextShow.ticketLabelShort || ticketLong : ''

/**
 * Splat logo with the next-show ticket pill beside it on the left, text links
 * on the right. No hamburger: on phones the links drop to their own row.
 * Hides while scrolling down and returns on any scroll up.
 */
export default function Nav() {
  // /music, /music.html and /music/ are all the same page.
  const path = (usePathname() || '/').replace(/(\.html|\/)$/, '') || '/'
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', y => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev && y > 160)
    setSolid(y > 40)
  })

  const active = nav.find(n => path === n.href)?.href ?? null
  const underline = hover ?? active

  // The pill sells the next show, so it goes where that show is sold. A date
  // with no ticket link yet falls back to the homepage section.
  const ticketProps = nextShow?.link
    ? { href: nextShow.link, target: '_blank', rel: 'noopener' }
    : { href: '/#upcoming-section' }

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]"
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`nav-scrim border-b transition-[background-color,border-color] duration-500 ${solid ? 'border-bone/8 bg-umber/70' : 'border-transparent'}`}>
        <div className="flex flex-col gap-1 py-3 pl-[max(clamp(16px,4vw,32px),env(safe-area-inset-left))] pr-[max(clamp(16px,4vw,32px),env(safe-area-inset-right))] md:flex-row md:items-center md:justify-between md:py-4 short:flex-row short:items-center short:justify-between short:gap-4 short:py-1.5">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Dirty Aesthetic home" className="shrink-0">
              <motion.img
                src="/assets/images/logos/da-splat.png" alt="" width={120} height={120}
                className="h-9 w-auto md:h-12 short:h-8"
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
            <ul className="flex items-center justify-between gap-1 md:justify-end md:gap-6 short:justify-end short:gap-4" onMouseLeave={() => setHover(null)}>
              {nav.map(item => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHover(item.href)}
                    aria-current={active === item.href ? 'page' : undefined}
                    className="block whitespace-nowrap py-2 text-[clamp(1rem,4.4vw,1.1rem)] tracking-wide text-bone/85 [text-shadow:0_1px_10px_rgba(0,0,0,.65)] transition-colors hover:text-bone aria-[current=page]:text-bone md:text-[1.2rem] short:py-1 short:text-[1rem]"
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
