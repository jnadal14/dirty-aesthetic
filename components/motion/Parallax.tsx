'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

/** Drifts its content by `offset` px across the time it spends on screen. */
export default function Parallax({ children, offset = 80, className }: { children: React.ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // A transform string, not y: Motion runs it on the browser's view timeline.
  const transform = useTransform(scrollYProgress, [0, 1], [`translateY(${offset}px)`, `translateY(${-offset}px)`])
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ transform }} className="h-full w-full">{children}</motion.div>
    </div>
  )
}
