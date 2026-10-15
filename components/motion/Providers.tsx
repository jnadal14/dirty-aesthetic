'use client'

import { ReactLenis } from 'lenis/react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { SPRING } from '@/lib/motion'

/**
 * Site-wide motion setup. Lenis gives the weighted scroll; Motion's scroll
 * hooks read the same native scroll position, so the two never disagree.
 * Under reduced motion Lenis stays mounted (so the tree never changes shape
 * at hydration) but stops smoothing, and Motion drops transforms.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      <ReactLenis root options={{ lerp: 0.1, smoothWheel: !reduce, anchors: { offset: -80 }, allowNestedScroll: true }}>
        {children}
      </ReactLenis>
    </MotionConfig>
  )
}
