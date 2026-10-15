'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useState } from 'react'
import Picture, { videoCoverSet } from './Picture'
import { SNAP } from '@/lib/motion'

type Props = {
  id: string
  title: string
  /** Accessible name for the play button. */
  label: string
  /** Slug of a master in assets/images/video/<slug>-{640,1280,1920}; YouTube's thumbnail otherwise. */
  cover?: string
  sizes?: string
  priority?: boolean
  className?: string
  rounded?: string
}

/**
 * Click-to-load YouTube embed. The real player is 500KB+ of script that runs
 * the moment an iframe exists, so only a cover image and a button are on the
 * page until someone presses play. The cover leans toward the pointer.
 */
export default function YouTubeFacade({ id, title, label, cover, sizes = '92vw', priority, className = '', rounded = 'rounded-2xl' }: Props) {
  const [playing, setPlaying] = useState(false)
  const rx = useSpring(useMotionValue(0), SNAP)
  const ry = useSpring(useMotionValue(0), SNAP)

  function lean(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || playing) return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 5)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 4)
  }
  const rest = () => { rx.set(0); ry.set(0) }

  return (
    <div className="[perspective:1200px]">
      <motion.div
        onPointerMove={lean}
        onPointerLeave={rest}
        style={{ rotateX: rx, rotateY: ry }}
        whileHover={playing ? undefined : { y: -4 }}
        className={`group relative aspect-video overflow-hidden bg-coal shadow-[0_8px_40px_rgba(0,0,0,.4)] ${rounded} ${className}`}
      >
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            {cover ? (
              <Picture
                src={`/assets/images/video/${cover}-1280.jpg`}
                srcSet={videoCoverSet(cover, 'jpg')}
                webpSrcSet={videoCoverSet(cover, 'webp')}
                sizes={sizes}
                width={1920}
                height={1080}
                alt=""
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
            )}
            <button type="button" aria-label={label} onClick={() => setPlaying(true)}
              className="absolute inset-0 grid cursor-pointer place-items-center bg-gradient-to-t from-black/30 via-transparent to-transparent">
              <motion.span
                className="grid size-[clamp(52px,7vw,72px)] place-items-center rounded-full bg-black/60 backdrop-blur-sm ring-1 ring-bone/20 transition-colors group-hover:bg-accent"
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={SNAP}
              >
                <svg viewBox="0 0 24 24" className="ml-1 size-[38%] fill-bone" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
              </motion.span>
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
