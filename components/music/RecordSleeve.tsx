'use client'

import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import Picture, { coverSet } from '../Picture'
import ImageReveal from '../motion/ImageReveal'

/**
 * The album cover with its record: once the cover has been revealed the disc
 * slides out of the sleeve, spinning, then keeps turning with the page while
 * cover and record sink back and dim as they leave the screen.
 */
export default function RecordSleeve() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // One rotation: the spin-in on mount (0 → 320°) plus the turn with the page (another 540°).
  const intro = useMotionValue(0)
  const spin = useTransform(() => intro.get() + (reduce ? 0 : scrollYProgress.get() * 540))
  useEffect(() => {
    if (reduce) return
    const a = animate(intro, 320, { duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 1.1 })
    return () => a.stop()
  }, [intro, reduce])
  const sink = useTransform(() => (reduce ? 1 : 1 - scrollYProgress.get() * 0.15))
  const dim = useTransform(() => (reduce ? 1 : 1 - scrollYProgress.get() * 0.7))
  const pull = { type: 'spring', visualDuration: 1.1, bounce: 0.15, delay: 1.1 } as const

  return (
    <motion.div ref={ref} className="relative w-full" style={{ scale: sink, opacity: dim }}>
      <motion.div className="relative" initial={{ x: '0%' }} animate={{ x: reduce ? '0%' : '-16%' }} transition={pull}>
        <motion.div aria-hidden className="pointer-events-none absolute inset-[3%] z-0" initial={{ x: '0%' }} animate={{ x: reduce ? '0%' : '40%' }} transition={{ ...pull, bounce: 0.18 }}>
          <motion.div className="record-vinyl" style={{ rotate: spin }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/covers/cover_LP_modern_nostalgia-600.webp" alt="" className="relative size-[32%] rounded-full object-cover" decoding="async" />
          </motion.div>
        </motion.div>
        <ImageReveal onMount className="relative z-10 rounded-[10px] shadow-[0_24px_70px_rgba(0,0,0,.6)]">
          <Picture src="assets/images/covers/cover_LP_modern_nostalgia.jpg" webp="assets/images/covers/cover_LP_modern_nostalgia.webp" webpSrcSet={coverSet('cover_LP_modern_nostalgia', 1200)}
            alt="Modern Nostalgia album cover" width={1200} height={1200} priority className="h-auto w-full" sizes="(min-width: 900px) 420px, 80vw" />
        </ImageReveal>
      </motion.div>
    </motion.div>
  )
}
