'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'

/** Pulls its child a little toward the cursor, springing back on leave. */
export default function Magnetic({ children, strength = 0.35, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })

  function move(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  function leave() { x.set(0); y.set(0) }

  return (
    <motion.div ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ x, y }} className={className ?? 'inline-block'}>
      {children}
    </motion.div>
  )
}
