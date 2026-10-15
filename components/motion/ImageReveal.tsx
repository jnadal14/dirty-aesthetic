'use client'

import { motion } from 'motion/react'
import { EASE } from '@/lib/motion'

/**
 * Artwork reveal: the clip opens from the bottom while the picture inside
 * un-zooms and un-blurs. For covers and product shots, not full-screen layers.
 * On mount it runs in CSS (.enter-clip / .enter-unzoom) from the first paint.
 */
export default function ImageReveal({ children, className = '', delay = 0, onMount }: {
  children: React.ReactNode; className?: string; delay?: number; onMount?: boolean
}) {
  if (onMount) {
    const d = { '--d': `${delay}s` } as React.CSSProperties
    return (
      <div className={`enter-clip overflow-hidden ${className}`} style={d}>
        <div className="enter-unzoom h-full w-full" style={d}>{children}</div>
      </div>
    )
  }
  const view = { once: true, margin: '0px 0px -10% 0px' }
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={view}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.18, filter: 'blur(10px)' }}
        whileInView={{ scale: 1, filter: 'blur(0px)' }}
        viewport={view}
        transition={{ duration: 1.4, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
