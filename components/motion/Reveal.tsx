'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE } from '@/lib/motion'

type Props = HTMLMotionProps<'div'> & {
  delay?: number; y?: number; scale?: number
  /** Above the fold: play from the first paint in CSS (see .enter-up) instead of waiting for hydration. */
  onMount?: boolean
}

/**
 * Fades content up into place the first time it scrolls into view.
 * Transform and opacity only: an animated blur repaints the whole block every frame.
 */
export default function Reveal({ delay = 0, y = 32, scale = 1, onMount, children, ...rest }: Props) {
  if (onMount) {
    const vars = { '--d': `${delay}s`, '--y': `${y}px`, '--s': scale } as React.CSSProperties
    return (
      <div id={rest.id} className={`enter-up ${rest.className ?? ''}`} style={vars}>
        {children as React.ReactNode}
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
