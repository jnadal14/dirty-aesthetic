'use client'

import Lenis from 'lenis'
import { LenisContext } from 'lenis/react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { SPRING } from '@/lib/motion'

/**
 * Site-wide motion setup. Lenis gives the weighted wheel scroll on computers
 * (mouse or trackpad) and is shared through lenis/react's context, so
 * useLenis() works as usual. Phones and tablets keep plain native scrolling:
 * Lenis never smooths touch, and its non-passive touch listeners on window
 * would make every swipe wait for the main thread. Motion's scroll hooks read
 * the same native scroll position either way.
 *
 * The tree is the same on the server and the client; only the context value
 * changes once Lenis exists, so nothing re-mounts after hydration. Under
 * reduced motion Lenis still runs but stops smoothing, and Motion drops
 * transforms.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const [lenis, setLenis] = useState<Lenis>()

  useEffect(() => {
    // Follows the primary pointer, so a tablet that gains a trackpad gets
    // Lenis and a laptop folded into a tablet drops it.
    const fine = matchMedia('(hover: hover) and (pointer: fine)')
    let instance: Lenis | undefined
    const sync = () => {
      instance?.destroy()
      instance = fine.matches ? new Lenis({ autoRaf: true, lerp: 0.15, smoothWheel: !reduce, anchors: { offset: -80 } }) : undefined
      setLenis(instance)
    }
    sync()
    fine.addEventListener('change', sync)
    return () => {
      fine.removeEventListener('change', sync)
      instance?.destroy()
    }
  }, [reduce])

  const context = useMemo(() => lenis
    ? { lenis, addCallback: (cb: (l: Lenis) => void) => { lenis.on('scroll', cb) }, removeCallback: (cb: (l: Lenis) => void) => lenis.off('scroll', cb) }
    : null, [lenis])

  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      <LenisContext.Provider value={context}>{children}</LenisContext.Provider>
    </MotionConfig>
  )
}
