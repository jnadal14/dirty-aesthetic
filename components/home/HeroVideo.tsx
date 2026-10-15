'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The hero timelapse. Picks the phone or desktop cut, starts after the page
 * has loaded (or 2.5s in), skips itself for reduced motion, data saver and 2G,
 * and pauses while the hero is off screen. The section's own background is
 * the clip's first frame, so nothing changes if the video never plays.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return

    const phone = matchMedia('(max-width: 640px)')
    const src = () => (phone.matches ? '/assets/video/hero-timelapse-mobile.mp4' : '/assets/video/hero-timelapse.mp4')
    let started = false
    let onScreen = true
    const play = () => { if (onScreen) video.play().catch(() => {}) }
    const start = () => {
      if (started) return
      started = true
      video.src = src()
      video.preload = 'auto'
      play()
    }
    const swap = () => { if (!started) return; setPlaying(false); video.src = src(); play() }

    let timer: ReturnType<typeof setTimeout> | undefined
    if (document.readyState === 'complete') start()
    else { addEventListener('load', start, { once: true }); timer = setTimeout(start, 2500) }
    phone.addEventListener('change', swap)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      if (!started) return
      if (onScreen) play()
      else video.pause()
    })
    io.observe(video)
    return () => {
      clearTimeout(timer)
      removeEventListener('load', start)
      phone.removeEventListener('change', swap)
      io.disconnect()
    }
  }, [])

  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
      muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    />
  )
}
