'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A section's own photographic background: desktop and phone cuts from
 * /assets/images/backgrounds under a scrim. Painted on the section box, so it
 * scrolls with the section (no extra fixed layer).
 *
 * Lazy by default: the photo is only assigned once the section is within a
 * screen and a half of the viewport. CSS backgrounds otherwise all download at
 * startup, which on the homepage was ~630 KB of photos several screens down,
 * competing with the hero and holding back the load event the hero video
 * waits for. Pass lazy={false} for a section that is on screen at load.
 */
export default function SectionBg({ image, scrim, mobile = true, position = 'center', lazy = true }: {
  image: string; scrim: string; mobile?: boolean; position?: string; lazy?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(!lazy)
  useEffect(() => {
    if (near || !ref.current) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true) }, { rootMargin: '150% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near])

  const set = (n: string) => `image-set(url('/assets/images/backgrounds/${n}.webp') type('image/webp'), url('/assets/images/backgrounds/${n}.jpg') type('image/jpeg'))`
  const photo = near ? { ['--bg-d' as string]: set(image), ['--bg-m' as string]: set(mobile ? `${image}-mobile` : image) } : {}
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="page-backdrop-img absolute inset-0 bg-cover" style={{ backgroundPosition: position, ...photo }} />
      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  )
}
