'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import Picture from '../Picture'

// A deterministic ragged edge, so the tear is the same on every visit and resize.
function ragged(seed: number, points: number, depth: number) {
  let s = seed * 9301 + 49297
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  return Array.from({ length: points + 1 }, (_, k) => ({ x: (k / points) * 100, y: next() * depth }))
}
const tear = (seed: number, depth = 16) => {
  const top = ragged(seed, 28, depth).map(p => `${p.x.toFixed(2)}% ${p.y.toFixed(1)}px`)
  const bottom = ragged(seed + 7, 28, depth).reverse().map(p => `${p.x.toFixed(2)}% calc(100% - ${p.y.toFixed(1)}px)`)
  return `polygon(${top.join(',')},${bottom.join(',')})`
}
const TEAR = tear(3)

/** Full-bleed band photo with torn paper edges; the picture drifts inside its frame on scroll. */
export default function TornPhoto() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15])
  return (
    <div ref={ref} className="relative z-10 -my-4 h-[clamp(260px,46vw,620px)] overflow-hidden" style={{ clipPath: TEAR }}>
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Picture src="assets/images/backgrounds/header-desktop.jpg" webp="assets/images/backgrounds/header-desktop.webp" alt="Dirty Aesthetic"
          className="h-full w-full object-cover" sizes="100vw" />
      </motion.div>
    </div>
  )
}
