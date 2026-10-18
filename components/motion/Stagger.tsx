'use client'

import { motion, type Variants } from 'motion/react'
import { LEAD_IN, SPRING, STAGGER } from '@/lib/motion'

const parent: Variants = { hidden: {}, show: {} }
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: SPRING },
}

type Tag = 'div' | 'ul' | 'ol' | 'section'

/**
 * Orchestrated list/grid entrance: children wrapped in <StaggerItem> settle in
 * one after another on the house spring once the group scrolls into view.
 */
export function Stagger({ as = 'div', className, children, delay = LEAD_IN, stagger = STAGGER, onMount }: {
  as?: Tag; className?: string; children: React.ReactNode; delay?: number; stagger?: number; onMount?: boolean
}) {
  const M = motion[as]
  const trigger = onMount
    ? { animate: 'show' }
    : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }
  return (
    <M className={className} variants={parent} initial="hidden" {...trigger} transition={{ staggerChildren: stagger, delayChildren: delay }}>
      {children}
    </M>
  )
}

export function StaggerItem({ as = 'div', className, children, ...rest }: {
  as?: 'div' | 'li' | 'article' | 'a'; className?: string; children: React.ReactNode
} & Record<string, unknown>) {
  const M = motion[as] as typeof motion.div
  return <M className={className} variants={staggerItem} {...rest}>{children}</M>
}
