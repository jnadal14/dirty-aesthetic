'use client'

import { animate, motion, useMotionValue, useMotionValueEvent, useSpring } from 'motion/react'
import { useRef, useState } from 'react'
import Picture, { coverSet } from '../Picture'
import { SPRING } from '@/lib/motion'

export type Release = { title: string; meta: React.ReactNode; href: string; cover: string; size: number; alt: string }

/**
 * A release cover that turns over to show its date and a listen link. The
 * face turned away is hidden by script as the card passes 90°, because
 * backface-visibility alone is not reliable in WebKit.
 */
export default function FlipCover({ release, index }: { release: Release; index: number }) {
  const angle = useMotionValue(0)
  const [backUp, setBackUp] = useState(false)
  const [open, setOpen] = useState(false)
  const frontRef = useRef<HTMLButtonElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const rx = useSpring(0, { stiffness: 300, damping: 25 })
  const ry = useSpring(0, { stiffness: 300, damping: 25 })
  const service = release.href.includes('spotify') ? 'Spotify' : new URL(release.href).hostname.replace(/^www\./, '')

  useMotionValueEvent(angle, 'change', v => {
    const a = Math.abs(v % 360)
    const up = a > 90 && a < 270
    if (up !== backUp) {
      setBackUp(up)
      ;(up ? linkRef : frontRef).current?.focus({ preventScroll: true })
    }
  })

  function flip(next: boolean) {
    setOpen(next)
    animate(angle, next ? 180 : 0, { type: 'spring', stiffness: 170, damping: 18 })
  }

  function lean(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 16)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 16)
  }

  const art = (
    <Picture src={`assets/images/covers/${release.cover}.jpg`} webp={`assets/images/covers/${release.cover}.webp`} webpSrcSet={coverSet(release.cover, release.size)}
      alt={release.alt} width={release.size} height={release.size} sizes="(min-width: 900px) 340px, 45vw"
      className="h-full w-full object-cover" />
  )

  return (
    <motion.article
      className="text-center"
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ ...SPRING, delay: (index % 3) * 0.08 }}
    >
      <div className="[perspective:1000px]" onPointerMove={lean} onPointerLeave={() => { rx.set(0); ry.set(0) }}>
        <motion.div style={{ rotateX: rx, rotateY: ry }} whileTap={{ scale: 0.95 }} className="[transform-style:preserve-3d]">
          <motion.div style={{ rotateY: angle }} className="relative aspect-square [transform-style:preserve-3d]">
            <button
              ref={frontRef}
              type="button"
              aria-pressed={open}
              aria-label={`Show details for ${release.title}`}
              onClick={() => flip(true)}
              inert={open}
              style={{ visibility: backUp ? 'hidden' : 'visible' }}
              className="absolute inset-0 block cursor-pointer overflow-hidden rounded-[10px] border border-bone/6 bg-coal shadow-[0_16px_48px_rgba(0,0,0,.45)] [backface-visibility:hidden]"
            >
              {art}
            </button>
            <div
              inert={!open}
              onClick={e => { if (!(e.target as HTMLElement).closest('a')) flip(false) }}
              style={{ visibility: backUp ? 'visible' : 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[10px] border border-bone/6 p-4 [backface-visibility:hidden]"
            >
              <div aria-hidden className="absolute inset-0 -z-0 brightness-[.32] saturate-[.8]">{art}</div>
              <p className="relative text-[clamp(1em,2.4vw,1.35em)] leading-tight text-bone [text-shadow:0_2px_12px_rgba(0,0,0,.8)]">{release.title}</p>
              <p className="relative text-[clamp(.8em,1.5vw,.95em)] text-white/80">{release.meta}</p>
              <a ref={linkRef} href={release.href} target="_blank" rel="noopener" className="btn relative mt-1 !min-h-0 !px-4 !py-2 text-[.85em]">Listen on {service}</a>
              <button type="button" onClick={() => flip(false)} className="relative min-h-11 text-[.85em] text-sand underline">Flip back</button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <h3 className="display mt-3 mb-1 text-[clamp(1em,2vw,1.25em)]">{release.title}</h3>
      <p className="text-[clamp(.8em,1.5vw,.95em)] text-sand">{release.meta}</p>
    </motion.article>
  )
}
