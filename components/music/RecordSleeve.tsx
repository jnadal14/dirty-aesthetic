'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import Picture, { coverSet } from '../Picture'
import ImageReveal from '../motion/ImageReveal'
import { EASE } from '@/lib/motion'

/**
 * The album cover with its record: once the cover has been revealed the disc
 * slides out of the sleeve, spinning, then keeps turning with the page while
 * cover and record sink back and dim as they leave the screen. The scroll
 * effects are whole transform strings, which Motion runs on the browser's own
 * scroll timeline instead of recomputing them on the main thread every frame.
 */
export default function RecordSleeve() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Gated values, not gated style: the first frame is the same either way, so
  // the server's markup matches the client's.
  const sink = useTransform(scrollYProgress, [0, 1], ['scale(1)', reduce ? 'scale(1)' : 'scale(0.85)'])
  const dim = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.3])
  // The record's turn with the page (another 540°); its spin-in on mount (0 → 320°) is on the disc inside.
  const turn = useTransform(scrollYProgress, [0, 1], ['rotate(0deg)', reduce ? 'rotate(0deg)' : 'rotate(540deg)'])
  const pull = { type: 'spring', visualDuration: 1.1, bounce: 0.15, delay: 1.1 } as const

  return (
    <div ref={ref} className="relative w-full">
      <motion.div style={{ transform: sink, opacity: dim }}>
        <motion.div className="relative" initial={{ x: '0%' }} animate={{ x: reduce ? '0%' : '-16%' }} transition={pull}>
          <motion.div aria-hidden className="pointer-events-none absolute inset-[3%] z-0" initial={{ x: '0%' }} animate={{ x: reduce ? '0%' : '40%' }} transition={{ ...pull, bounce: 0.18 }}>
            <motion.div className="h-full w-full" style={{ transform: turn }}>
              <motion.div className="record-vinyl" initial={{ rotate: 0 }} animate={{ rotate: reduce ? 0 : 320 }} transition={{ duration: 1.6, ease: EASE, delay: 1.1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/covers/cover_LP_modern_nostalgia-600.webp" alt="" className="relative size-[32%] rounded-full object-cover" decoding="async" />
              </motion.div>
            </motion.div>
          </motion.div>
          <ImageReveal onMount className="relative z-10 rounded-[10px] shadow-[0_24px_70px_rgba(0,0,0,.6)]">
            <Picture src="assets/images/covers/cover_LP_modern_nostalgia.jpg" webp="assets/images/covers/cover_LP_modern_nostalgia.webp" webpSrcSet={coverSet('cover_LP_modern_nostalgia', 1200)}
              alt="Modern Nostalgia album cover" width={1200} height={1200} priority className="h-auto w-full" sizes="(min-width: 900px) 420px, 80vw" />
          </ImageReveal>
        </motion.div>
      </motion.div>
    </div>
  )
}
