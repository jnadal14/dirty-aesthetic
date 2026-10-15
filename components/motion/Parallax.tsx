'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

/** Drifts its content by `offset` px across the time it spends on screen. */
export default function Parallax({ children, offset = 80, className }: { children: React.ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">{children}</motion.div>
    </div>
  )
}
