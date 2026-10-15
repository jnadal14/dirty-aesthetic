'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE } from '@/lib/motion'

type Props = HTMLMotionProps<'div'> & {
  delay?: number; y?: number; blur?: boolean; scale?: number
  /** Above the fold: play from the first paint in CSS (see .enter-up) instead of waiting for hydration. */
  onMount?: boolean
}

/** Fades content up into place the first time it scrolls into view. */
export default function Reveal({ delay = 0, y = 32, blur = true, scale = 1, onMount, children, ...rest }: Props) {
  if (onMount) {
    const vars = { '--d': `${delay}s`, '--y': `${y}px`, '--s': scale } as React.CSSProperties
    return (
      <div id={rest.id} className={`enter-up ${blur ? 'enter-blur' : ''} ${rest.className ?? ''}`} style={vars}>
        {children as React.ReactNode}
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y, scale, filter: blur ? 'blur(8px)' : 'none' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
