'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The hero timelapse. Picks the phone or desktop cut, starts after the page
 * has loaded (or 2.5s in), skips itself for reduced motion, data saver and 2G,
 * and pauses while `active` is false (the hero is covered; see Hero). The section's own background is
 * the clip's first frame, so nothing changes if the video never plays.
 */
export default function HeroVideo({ active }: { active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const started = useRef(false)
  const shown = useRef(true)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return

    const phone = matchMedia('(max-width: 640px)')
    const src = () => (phone.matches ? '/assets/video/hero-timelapse-mobile.mp4' : '/assets/video/hero-timelapse.mp4')
    const start = () => {
      if (started.current) return
      started.current = true
      video.src = src()
      video.preload = 'auto'
      if (shown.current) video.play().catch(() => {})
    }
    const swap = () => { if (!started.current) return; setPlaying(false); video.src = src(); if (shown.current) video.play().catch(() => {}) }

    let timer: ReturnType<typeof setTimeout> | undefined
    if (document.readyState === 'complete') start()
    else { addEventListener('load', start, { once: true }); timer = setTimeout(start, 2500) }
    phone.addEventListener('change', swap)
    return () => {
      clearTimeout(timer)
      removeEventListener('load', start)
      phone.removeEventListener('change', swap)
    }
  }, [])

  useEffect(() => {
    shown.current = active
    const video = ref.current
    if (!video || !started.current) return
    if (active) video.play().catch(() => {})
    else video.pause()
  }, [active])

  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
      muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    />
  )
}
