'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'
import Picture from './Picture'
import { useLightbox } from './Lightbox'
import ImageReveal from './motion/ImageReveal'
import { SNAP } from '@/lib/motion'

type Props = {
  src: string
  webp: string
  webpSrcSet?: string
  fullSrc: string
  alt: string
  width: number
  height: number
  label: string
  sizes?: string
  priority?: boolean
  className?: string
  glow?: boolean
  onMount?: boolean
}

/**
 * Cover art or product shot: revealed on entry, leans toward the pointer,
 * presses on tap, and opens into the lightbox from where it sits.
 */
export default function Artwork({ src, webp, webpSrcSet, fullSrc, alt, width, height, label, sizes, priority, className = '', glow = true, onMount }: Props) {
  const { open } = useLightbox()
  const ref = useRef<HTMLButtonElement>(null)
  const rx = useSpring(useMotionValue(0), SNAP)
  const ry = useSpring(useMotionValue(0), SNAP)

  function lean(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6)
  }

  return (
    <div className={`relative [perspective:1200px] ${className}`}>
      {glow && <div aria-hidden className="art-glow absolute -inset-[8%] -z-10" />}
      <motion.button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={() => open([{ src: fullSrc, alt, width, height, origin: () => ref.current }])}
        onPointerMove={lean}
        onPointerLeave={() => { rx.set(0); ry.set(0) }}
        style={{ rotateX: rx, rotateY: ry }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SNAP}
        className="block w-full cursor-zoom-in"
      >
        <ImageReveal onMount={onMount} className="rounded-[10px] border border-bone/8 shadow-[0_24px_70px_rgba(0,0,0,.55)]">
          <Picture src={src} webp={webp} webpSrcSet={webpSrcSet} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className="h-auto w-full" />
        </ImageReveal>
      </motion.button>
    </div>
  )
}
