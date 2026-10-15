'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'

/** Pointer depth: the child tilts a few degrees toward a mouse (never touch). */
export default function Tilt({ children, className, max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const cfg = { stiffness: 150, damping: 18, mass: 0.6 }
  const rx = useSpring(useMotionValue(0), cfg)
  const ry = useSpring(useMotionValue(0), cfg)
  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * max)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 0.8)
  }
  return (
    <div className={`[perspective:900px] ${className ?? ''}`} onPointerMove={move} onPointerLeave={() => { rx.set(0); ry.set(0) }}>
      <motion.div style={{ rotateX: rx, rotateY: ry }}>{children}</motion.div>
    </div>
  )
}
