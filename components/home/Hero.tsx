'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { useRef } from 'react'
import HeroVideo from './HeroVideo'
import Button from '../Button'
import Tilt from '../motion/Tilt'
import { ArrowDown } from '../icons'
import { streamLink } from '@/lib/data'

/**
 * Landing hero: timelapse behind the wordmark, the release line, and the two
 * streaming buttons this campaign page exists for. On the way out the whole
 * stage recedes (scale → 0.85, opacity → 0.3) as the next section rises.
 */
export default function Hero() {
  // The section is sticky, so it never moves; progress is read off a marker
  // one screen tall at the top of the document instead.
  const ref = useRef<HTMLDivElement>(null)
  const lenis = useLenis()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const spotify = streamLink('spotify')
  const apple = streamLink('apple')

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: 0 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  // The entrance is CSS (.enter-*), so it plays from the first paint, not after hydration.
  const rise = (delay: number) => ({ style: { '--d': `${delay}s` } as React.CSSProperties })

  return (
    <>
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-svh min-h-[560px] short:min-h-[360px]" />
    <section id="top" className="sticky top-0 h-svh min-h-[560px] overflow-clip short:min-h-[360px]" aria-label="Modern Nostalgia, out now">
      <motion.div className="hero-still absolute inset-0 bg-umber" style={{ scale, opacity }}>
        <HeroVideo />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,26,19,.4)_0%,rgba(33,26,19,.65)_50%,rgba(33,26,19,.9)_100%)]" />

        <motion.div style={{ y: contentY }} className="absolute inset-0 flex flex-col items-center justify-center px-[clamp(16px,5vw,40px)] text-center">
          <h1>
            <Tilt max={8}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/logos/da-wordmark.png" alt="Dirty Aesthetic" fetchPriority="high" decoding="async"
                className="enter-wordmark w-[clamp(280px,60vw,600px)] drop-shadow-[0_4px_30px_rgba(0,0,0,.5)] short:w-[min(52vw,48svh)]"
                style={{ '--d': '0.1s' } as React.CSSProperties}
              />
            </Tilt>
          </h1>
          <div className="enter-up" {...rise(0.45)}>
            <p className="hero-caption mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[clamp(.86em,1.25vw,1.05em)] tracking-[1.4px]">
              <span className="text-[.78em] tracking-[2px] text-[#e0b78e]">Out Now</span> Modern Nostalgia <span className="text-[.78em] tracking-[2px] text-[#e0b78e]">Debut Album</span>
            </p>
          </div>
          <div {...rise(0.65)} className="enter-up mt-7 flex flex-col items-center gap-3 short:mt-4">
            {(spotify || apple) && (
              <div className="flex flex-wrap justify-center gap-3">
                {spotify && <Button variant="spotify" href={spotify} external>Spotify</Button>}
                {apple && <Button variant="apple" href={apple} external>Apple Music</Button>}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="ghost" onClick={() => go('modern-nostalgia-video-section')}>Watch the Video</Button>
              <Button variant="ghost" onClick={() => go('modern-nostalgia-album-section')}>Tracklist</Button>
            </div>
          </div>
        </motion.div>

        <button
          type="button" aria-label="Scroll to the next section" onClick={() => go('modern-nostalgia-album-section')}
          className="enter-up absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 px-4 py-2 text-[.7rem] uppercase tracking-[.3em] text-bone/70 hover:text-bone short:hidden"
          {...rise(1.1)}
        >
          Scroll
          <span className="scroll-bob">
            <ArrowDown className="size-5" />
          </span>
        </button>
      </motion.div>
    </section>
    </>
  )
}
