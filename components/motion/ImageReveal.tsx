'use client'

import { motion } from 'motion/react'
import { EASE } from '@/lib/motion'

/**
 * Artwork reveal: a short fade and rise, so the cover is readable almost at
 * once. Transform and opacity only (no blur or clip, which repaint the image
 * every frame). For covers and product shots, not full-screen layers.
 * On mount it runs in CSS (.enter-art) from the first paint.
 */
export default function ImageReveal({ children, className = '', delay = 0, onMount }: {
  children: React.ReactNode; className?: string; delay?: number; onMount?: boolean
}) {
  if (onMount) {
    return <div className={`enter-art overflow-hidden ${className}`} style={{ '--d': `${delay}s` } as React.CSSProperties}>{children}</div>
  }
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
