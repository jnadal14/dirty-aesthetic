'use client'

import { useEffect, useRef, useState } from 'react'

const ARTIST = 'https://open.spotify.com/embed/artist/6LJB3zSDmtQ3NxA6GjUwlt'
// How long a phone's scrolling has to have stopped before the player starts.
const SETTLE_MS = 700

/**
 * The Spotify artist player. Its iframe pulls ~700 KB of Spotify scripts and
 * fonts, so it is only created once the page has loaded and the player is
 * about to scroll into view (native lazy loading starts it more than a screen
 * early). On phones the iframe also shares the page's process and main
 * thread, so there it waits until scrolling has settled and the page is idle:
 * its start-up never lands in the middle of a swipe. Until then a placeholder
 * of the same size holds its place.
 */
export default function SpotifyEmbed({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const phone = !matchMedia('(hover: hover) and (pointer: fine)').matches
    let io: IntersectionObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let near = false
    let lastScroll = 0

    function mount() {
      if (!near) return
      if (phone && performance.now() - lastScroll < SETTLE_MS) return settle()
      setMounted(true)
      stop()
    }
    function settle() {
      clearTimeout(timer)
      timer = setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(mount, { timeout: 1000 }) : mount()), SETTLE_MS)
    }
    function onScroll() {
      lastScroll = performance.now()
      if (near) settle()
    }
    function stop() {
      io?.disconnect()
      removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
    const watch = () => {
      io = new IntersectionObserver(([e]) => {
        near = e.isIntersecting
        if (near) (phone ? settle : mount)()
      }, { rootMargin: '300px 0px' })
      io.observe(el)
      if (phone) addEventListener('scroll', onScroll, { passive: true })
    }
    if (document.readyState === 'complete') watch()
    else addEventListener('load', watch, { once: true })
    return () => { removeEventListener('load', watch); stop() }
  }, [])

  return (
    <div ref={ref} className={`overflow-hidden rounded-xl bg-[#282828] ${className}`}>
      {mounted && (
        <iframe className="block h-full w-full" src={ARTIST} title="Dirty Aesthetic on Spotify"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      )}
    </div>
  )
}
